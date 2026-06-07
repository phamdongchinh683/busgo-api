import type { UserInfo } from '../../model/common.js'
import type { AiChatResponse, AiChatState } from '../../model/body/chat/index.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'
import * as coupon from '../booking/coupon.js'
import * as promotionNew from '../booking/promotion-new.js'
import * as ticket from '../booking/ticket.js'
import * as bookingFlow from './booking-flow.js'

export type BusGoAgentAction =
    | 'ASK_USER'
    | 'CHAT'
    | 'SEARCH_SCHEDULES'
    | 'LIST_PICKUP_STOPS'
    | 'LIST_DROPOFF_STOPS'
    | 'CHECK_AVAILABLE_SEATS'
    | 'CREATE_HOLD_BOOKING'
    | 'GET_PROMOTIONS'
    | 'GET_BOOKING'

export type BusGoAgentDecision = {
    action: BusGoAgentAction
    args: Record<string, unknown>
    reply?: string | null
}

type AgentSession = {
    expiresAt: number
    state: AiChatState
}

const AGENT_SESSION_TTL_MS = 30 * 60 * 1000
const agentSessions = new Map<number, AgentSession>()
const PAYMENT_GUIDANCE =
    'Hiện tại mình chưa xử lý thanh toán trực tiếp trong chat. Bạn vào Profile > Vé > Đã giữ chỗ để chọn đơn đang chờ thanh toán và tiếp tục thanh toán nhé.'

export async function reply(params: {
    userInfo: UserInfo
    message: string
    state?: AiChatState
}): Promise<AiChatResponse> {
    const userId = Number(params.userInfo.id)
    // The request state identifies the exact chat flow; the user session is only a fallback.
    let state = normalizeAgentState(
        params.state ?? getAgentSession(userId) ?? { stage: 'idle' as const }
    )
    const messageState = mergeMessageIntoSearchState(params.message, state)
    state = messageState.state

    if (messageState.changed && getMissingSearchPrompt(state)) {
        state = await bookingFlow.resolveSearchStateLocations(state)
    }

    if (isExpiredHold(state)) {
        agentSessions.delete(userId)
        return {
            message: 'Vé giữ đã hết hạn. Bạn muốn tìm chuyến mới từ đâu đến đâu?',
            state: { stage: 'idle' },
        }
    }

    if (isResetRequest(params.message) && !messageState.changed) {
        agentSessions.delete(userId)
        return {
            message: 'Bạn muốn đi từ đâu đến đâu và ngày nào?',
            state: { stage: 'idle' },
        }
    }

    if (isRoundTripRequest(params.message)) {
        agentSessions.delete(userId)
        return {
            message:
                'Hiện tại mình chỉ hỗ trợ giữ chỗ vé một chiều trong chat. Bạn vui lòng đặt vé khứ hồi bằng luồng đặt vé thông thường nhé.',
            state: { stage: 'idle' },
        }
    }

    if (isPaymentRequest(params.message)) {
        return saveResponse(userId, {
            message: PAYMENT_GUIDANCE,
            state,
        })
    }

    if (messageState.changed && state.from && state.to && state.departureDate) {
        return executeAndSave({
            action: 'SEARCH_SCHEDULES',
            args: {
                from: state.from,
                to: state.to,
                departureDate: utils.time.formatCalendarDate(state.departureDate, 'YYYY-MM-DD'),
            },
            message: params.message,
            state,
            userId,
            userInfo: params.userInfo,
        })
    }

    if (messageState.changed && getMissingSearchPrompt(state)) {
        return executeAndSave({
            action: 'ASK_USER',
            message: params.message,
            state,
            userId,
            userInfo: params.userInfo,
        })
    }

    const deterministicAction = getDeterministicAction(params.message, state)
    if (deterministicAction) {
        return executeAndSave({
            action: deterministicAction,
            message: params.message,
            state,
            userId,
            userInfo: params.userInfo,
        })
    }

    let decision: BusGoAgentDecision
    try {
        decision = await service.openai.decideBusGoAgentAction({
            message: params.message,
            state,
            context: buildAgentContext(state),
        })
    } catch {
        return saveResponse(userId, {
            message: 'Mình chưa thể hiểu yêu cầu lúc này. Bạn muốn tìm chuyến hay đặt vé?',
            state,
        })
    }

    return executeAndSave({
        action: decision.action,
        args: decision.args,
        decisionReply: decision.reply,
        message: params.message,
        state,
        userId,
        userInfo: params.userInfo,
    })
}

async function executeAndSave(params: {
    action: BusGoAgentAction
    args?: Record<string, unknown>
    decisionReply?: string | null
    message: string
    state: AiChatState
    userId: number
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    try {
        const response = await executeDecision({
            decision: {
                action: params.action,
                args: params.args ?? {},
                reply: params.decisionReply,
            },
            message: params.message,
            state: params.state,
            userInfo: params.userInfo,
        })
        const naturalResponse =
            params.action === 'CHAT'
                ? response
                : await naturalizeResponse({
                      action: params.action,
                      response,
                      userMessage: params.message,
                  })
        return saveResponse(params.userId, naturalResponse)
    } catch {
        return saveResponse(params.userId, {
            message: 'Mình chưa xử lý được bước này, bạn thử lại giúp mình.',
            state: params.state,
        })
    }
}

async function naturalizeResponse(params: {
    action: BusGoAgentAction
    response: AiChatResponse
    userMessage: string
}): Promise<AiChatResponse> {
    if (params.action === 'CREATE_HOLD_BOOKING' && params.response.state?.bookingId) {
        return params.response
    }

    try {
        const message = await service.openai.generateBusGoAgentReply({
            action: params.action,
            context: buildAgentContext(params.response.state ?? { stage: 'idle' }),
            toolMessage: params.response.message,
            userMessage: params.userMessage,
        })

        if (!isSafeNaturalReply(message, params.response)) {
            return params.response
        }

        return {
            ...params.response,
            message,
        }
    } catch {
        return params.response
    }
}

function isSafeNaturalReply(message: string, response: AiChatResponse) {
    const normalized = normalize(message)
    const state = response.state

    if (!message.trim()) return false
    if (
        ['api', 'endpoint', 'payload', 'database', 'scheduleid', 'tripid', 'stationid'].some(
            pattern => normalized.includes(pattern)
        )
    ) {
        return false
    }
    if (!state?.bookingId && containsBookingSuccessClaim(normalized)) return false
    if (
        containsPaymentSuccessClaim(normalized) &&
        !containsPaymentSuccessClaim(normalize(response.message))
    ) {
        return false
    }

    const requiredValues = [
        ...(state?.scheduleOptions?.flatMap(item => [item.name, item.departureTime.slice(0, 5)]) ??
            []),
        ...(state?.pickupOptions?.map(item => item.address) ?? []),
        ...(state?.dropoffOptions?.map(item => item.address) ?? []),
        ...(state?.seatOptions?.map(item => item.seatNumber) ?? []),
        ...extractProtectedReplyValues(response.message),
    ]

    return requiredValues.every(value => normalize(message).includes(normalize(value)))
}

function extractProtectedReplyValues(message: string) {
    const patterns = [
        /\b\d{1,2}:\d{2}(?::\d{2})?\b/g,
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
        /\b\d+(?:[.,]\d+)*đ\b/g,
        /\b\d+(?:[.,]\d+)?%\b/g,
        /\b[A-Z0-9]+(?:[-_][A-Z0-9]+)+\b/g,
    ]

    return [...new Set(patterns.flatMap(pattern => message.match(pattern) ?? []))]
}

function containsBookingSuccessClaim(message: string) {
    return [
        'da giu cho thanh cong',
        'giu cho thanh cong',
        'da dat ve thanh cong',
        'dat ve thanh cong',
    ].some(pattern => message.includes(pattern))
}

function containsPaymentSuccessClaim(message: string) {
    return [
        'da thanh toan thanh cong',
        'thanh toan thanh cong',
        'da thanh toan',
        'da tra tien',
    ].some(pattern => message.includes(pattern))
}

async function executeDecision(params: {
    decision: BusGoAgentDecision
    message: string
    state: AiChatState
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    switch (params.decision.action) {
        case 'ASK_USER': {
            const mergedState = mergeDecisionArgsIntoState({
                args: params.decision.args,
                message: params.message,
                reply: params.decision.reply,
                state: params.state,
            })

            if (
                mergedState.from &&
                mergedState.to &&
                mergedState.departureDate &&
                isScheduleSearchRequest(params.message)
            ) {
                return bookingFlow.searchSchedules({
                    args: {
                        from: mergedState.from,
                        to: mergedState.to,
                        departureDate: utils.time.formatCalendarDate(
                            mergedState.departureDate,
                            'YYYY-MM-DD'
                        ),
                    },
                    message: params.message,
                    state: mergedState,
                })
            }

            const state = await bookingFlow.resolveSearchStateLocations(mergedState)
            return {
                message:
                    getMissingSearchPrompt(state) ??
                    params.decision.reply?.trim() ??
                    'Bạn muốn tìm chuyến hay đặt vé từ đâu đến đâu?',
                state: withSearchAwaitingField(state),
            }
        }
        case 'CHAT':
            return {
                message:
                    params.decision.reply?.trim() ??
                    'Mình có thể giúp bạn tìm chuyến, chọn điểm đón trả, kiểm tra ghế và giữ chỗ. Bạn đang cần hỗ trợ gì?',
                state: params.state,
            }
        case 'SEARCH_SCHEDULES':
            return bookingFlow.searchSchedules({
                args: params.decision.args,
                message: params.message,
                state: params.state,
            })
        case 'LIST_PICKUP_STOPS':
            return bookingFlow.listPickupStops({
                message: params.message,
                state: params.state,
            })
        case 'LIST_DROPOFF_STOPS':
            return bookingFlow.listDropoffStops({
                message: params.message,
                state: params.state,
            })
        case 'CHECK_AVAILABLE_SEATS':
            return bookingFlow.checkAvailableSeats({
                message: params.message,
                state: params.state,
            })
        case 'CREATE_HOLD_BOOKING':
            return bookingFlow.createHoldBooking({
                message: params.message,
                state: params.state,
                userInfo: params.userInfo,
            })
        case 'GET_PROMOTIONS':
            return getPromotions(params.state)
        case 'GET_BOOKING':
            return getBooking({
                args: params.decision.args,
                message: params.message,
                state: params.state,
                userInfo: params.userInfo,
            })
    }
}

async function getPromotions(state: AiChatState): Promise<AiChatResponse> {
    if (state.orderTotal !== undefined) {
        const result = await coupon.getCoupons({
            orderTotal: state.orderTotal,
            ...(state.companyId ? { companyId: state.companyId } : {}),
        })

        if (result.coupons.length === 0) {
            return {
                message: 'Hiện chưa có mã giảm giá phù hợp với vé bạn đang chọn.',
                state,
            }
        }

        return {
            message: [
                'Các mã giảm giá phù hợp:',
                ...result.coupons.slice(0, 5).map((item, index) => {
                    const value =
                        item.discountType === 'percent'
                            ? `${item.discountValue}%`
                            : formatMoney(item.discountValue)
                    return `${index + 1}. ${item.code} - giảm ${value}`
                }),
            ].join('\n'),
            state,
        }
    }

    const result = await promotionNew.list({ limit: 5, status: 'true' })
    if (result.items.length === 0) {
        return {
            message: 'Hiện chưa có chương trình khuyến mãi đang hoạt động.',
            state,
        }
    }

    return {
        message: [
            'Các chương trình khuyến mãi đang có:',
            ...result.items.map(
                (item, index) => `${index + 1}. ${item.title}: ${shorten(item.content, 140)}`
            ),
        ].join('\n'),
        state,
    }
}

async function getBooking(params: {
    args: Record<string, unknown>
    message: string
    state: AiChatState
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    const result = await ticket.getTickets({ limit: 10 }, params.userInfo.id)
    const bookingCode =
        getStringArg(params.args, 'bookingCode') ?? extractBookingCode(params.message)
    let tickets = result.tickets

    if (bookingCode) {
        tickets = tickets.filter(item => item.code?.toLowerCase() === bookingCode.toLowerCase())
    } else if (params.state.bookingId) {
        tickets = tickets.filter(item => item.bookingId === params.state.bookingId)
    }

    if (tickets.length === 0) {
        return {
            message: bookingCode
                ? `Mình chưa tìm thấy vé có mã ${bookingCode}.`
                : 'Bạn chưa có vé nào để mình kiểm tra.',
            state: params.state,
        }
    }

    return {
        message: [
            bookingCode ? `Trạng thái vé ${bookingCode}:` : 'Các vé gần đây của bạn:',
            ...tickets.slice(0, 5).map((item, index) => {
                const departureDate = item.departureDate
                    ? ` - đi ngày ${utils.time.formatCalendarDate(item.departureDate)}`
                    : ''
                const expiredAt =
                    item.status === 'pending' && item.expiredAt
                        ? ` - giữ đến ${utils.time.formatCalendarDate(item.expiredAt, 'HH:mm DD/MM/YYYY')}`
                        : ''
                return `${index + 1}. ${item.code ?? 'Chưa có mã'} - ${formatBookingStatus(item.status)} - ${formatMoney(item.totalAmount)}${departureDate}${expiredAt}`
            }),
        ].join('\n'),
        state: params.state,
    }
}

function saveResponse(userId: number, response: AiChatResponse) {
    if (!response.state || shouldClearSession(response.state)) {
        agentSessions.delete(userId)
        return response
    }

    const defaultExpiresAt = Date.now() + AGENT_SESSION_TTL_MS
    const holdExpiresAt = response.state.expiredAt?.getTime()
    agentSessions.set(userId, {
        state: response.state,
        expiresAt:
            response.state.stage === 'booking_created' && holdExpiresAt
                ? Math.min(defaultExpiresAt, holdExpiresAt)
                : defaultExpiresAt,
    })
    return response
}

function getAgentSession(userId: number) {
    const session = agentSessions.get(userId)
    if (!session) return undefined

    if (session.expiresAt <= Date.now()) {
        agentSessions.delete(userId)
        return undefined
    }

    return session.state
}

function shouldClearSession(state: AiChatState) {
    return (
        (!state.stage || state.stage === 'idle') &&
        !state.awaiting &&
        !state.from &&
        !state.to &&
        !state.departureDate
    )
}

function isExpiredHold(state: AiChatState) {
    return (
        state.stage === 'booking_created' &&
        state.expiredAt !== undefined &&
        state.expiredAt.getTime() <= Date.now()
    )
}

function buildAgentContext(state: AiChatState) {
    return JSON.stringify({
        stage: state.stage ?? 'idle',
        awaiting: state.awaiting,
        route: state.from || state.to ? `${state.from ?? '?'} -> ${state.to ?? '?'}` : undefined,
        departureDate: state.departureDate
            ? utils.time.formatCalendarDate(state.departureDate, 'YYYY-MM-DD')
            : undefined,
        schedules: state.scheduleOptions?.map(item => `${item.name} ${item.departureTime}`),
        selectedSchedule: state.selectedSchedule
            ? `${state.selectedSchedule.name} ${state.selectedSchedule.departureTime}`
            : undefined,
        pickupOptions: state.pickupOptions?.map(item => `${item.address}, ${item.city}`),
        selectedPickup: state.selectedPickup
            ? `${state.selectedPickup.address}, ${state.selectedPickup.city}`
            : undefined,
        dropoffOptions: state.dropoffOptions?.map(item => `${item.address}, ${item.city}`),
        selectedDropoff: state.selectedDropoff
            ? `${state.selectedDropoff.address}, ${state.selectedDropoff.city}`
            : undefined,
        seatOptions: state.seatOptions?.map(item => item.seatNumber),
        selectedSeat: state.selectedSeat?.seatNumber,
    })
}

function getDeterministicAction(message: string, state: AiChatState): BusGoAgentAction | undefined {
    if (isPromotionRequest(message)) return 'GET_PROMOTIONS'
    if (isBookingLookupRequest(message) && state.stage !== 'seat_listed') return 'GET_BOOKING'

    if (!bookingFlow.hasMatchingCurrentOption(message, state)) return undefined

    if (state.stage === 'schedules_listed') return 'LIST_PICKUP_STOPS'
    if (state.stage === 'pickup_listed') return 'LIST_DROPOFF_STOPS'
    if (state.stage === 'dropoff_listed') return 'CHECK_AVAILABLE_SEATS'
    if (state.stage === 'seat_listed') return 'CREATE_HOLD_BOOKING'
}

function normalizeAgentState(state: AiChatState): AiChatState {
    if (state.bookingId) return { ...state, stage: 'booking_created' }
    if (state.seatOptions?.length) return { ...state, stage: 'seat_listed' }
    if (state.dropoffOptions?.length) return { ...state, stage: 'dropoff_listed' }
    if (state.pickupOptions?.length) return { ...state, stage: 'pickup_listed' }
    if (state.scheduleOptions?.length) return { ...state, stage: 'schedules_listed' }
    if (state.selectedSchedule && !state.departureDate) return { ...state, stage: 'need_date' }

    if (
        state.stage === 'booking_created' ||
        state.stage === 'seat_listed' ||
        state.stage === 'dropoff_listed' ||
        state.stage === 'pickup_listed' ||
        state.stage === 'schedules_listed' ||
        state.stage === 'need_date'
    ) {
        return {
            stage: 'idle',
            awaiting: state.awaiting,
            from: state.from,
            to: state.to,
            departureDate: state.departureDate,
        }
    }

    return state
}

function mergeDecisionArgsIntoState(params: {
    args: Record<string, unknown>
    message: string
    reply?: string | null
    state: AiChatState
}): AiChatState {
    let from = getStringArg(params.args, 'from') ?? params.state.from
    let to = getStringArg(params.args, 'to') ?? params.state.to
    const departureDate =
        getDateArg(params.args, 'departureDate') ??
        extractDateFromMessage(params.message) ??
        params.state.departureDate

    const simpleLocation = getSimpleLocationInput(params.message)
    if (simpleLocation && !from && params.state.awaiting === 'from') {
        from = simpleLocation
    }
    if (simpleLocation && !to && params.state.awaiting === 'to') {
        to = simpleLocation
    }

    return {
        ...params.state,
        stage: 'idle',
        awaiting: undefined,
        from,
        to,
        departureDate,
    }
}

function mergeMessageIntoSearchState(
    message: string,
    state: AiChatState
): { changed: boolean; state: AiChatState } {
    const search = bookingFlow.extractTripSearchParams(message)
    const hasRouteDetails = Boolean(search.from || search.to)
    const hasDateDetail = search.date !== undefined

    if (hasRouteDetails || hasDateDetail) {
        return {
            changed: true,
            state: {
                stage: 'idle',
                awaiting: undefined,
                from: search.from ?? state.from,
                to: search.to ?? state.to,
                departureDate: search.date ?? state.departureDate,
            },
        }
    }

    if (
        (state.stage === 'idle' || state.stage === 'need_date') &&
        (state.awaiting === 'from' || state.awaiting === 'to')
    ) {
        const simpleLocation = getSimpleLocationInput(message)
        if (simpleLocation) {
            return {
                changed: true,
                state: {
                    stage: 'idle',
                    awaiting: undefined,
                    from: state.awaiting === 'from' ? simpleLocation : state.from,
                    to: state.awaiting === 'to' ? simpleLocation : state.to,
                    departureDate: state.departureDate,
                },
            }
        }
    }

    return { changed: false, state }
}

function withSearchAwaitingField(state: AiChatState): AiChatState {
    return {
        ...state,
        awaiting: !state.from
            ? 'from'
            : !state.to
              ? 'to'
              : !state.departureDate
                ? 'departureDate'
                : undefined,
    }
}

function getMissingSearchPrompt(state: AiChatState) {
    if (!state.from) return 'Bạn muốn đi từ đâu?'
    if (!state.to) return 'Bạn muốn đi đến đâu?'
    if (!state.departureDate) return 'Bạn muốn đi vào ngày nào?'
}

function getSimpleLocationInput(message: string) {
    const value = message.trim()
    const normalized = normalize(value)

    if (!value || value.length > 80 || extractDateFromMessage(value)) return undefined
    if (
        [
            'di ',
            'den ',
            'tu ',
            'chon ',
            'ghe ',
            'diem ',
            'tim ',
            'dat ',
            've ',
            'khuyen mai',
            'thanh toan',
        ].some(pattern => normalized.includes(pattern))
    ) {
        return undefined
    }

    return value
}

function getDateArg(args: Record<string, unknown>, key: string) {
    const value = args[key]
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    if (typeof value !== 'string') return undefined
    return parseCalendarDate(value)
}

function extractDateFromMessage(message: string) {
    const normalized = normalize(message)
    if (normalized.includes('hom nay')) return utils.time.getRelativeAppCalendarDate(0)
    if (normalized.includes('mai')) return utils.time.getRelativeAppCalendarDate(1)
    if (
        normalized.includes('ngay mot') ||
        normalized.includes('ngay kia') ||
        normalized === 'mot'
    ) {
        return utils.time.getRelativeAppCalendarDate(2)
    }

    return parseCalendarDate(message)
}

function parseCalendarDate(value: string) {
    const iso = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
    if (iso) {
        return utils.time.getAppCalendarDate({
            year: Number(iso[1]),
            month: Number(iso[2]),
            day: Number(iso[3]),
        })
    }

    const slash = value.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
    if (!slash) return undefined

    const year = slash[3]
        ? Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
        : utils.time.getNow().year()

    return utils.time.getAppCalendarDate({
        year,
        month: Number(slash[2]),
        day: Number(slash[1]),
    })
}

function isResetRequest(message: string) {
    const normalized = normalize(message)
    return [
        'tim chuyen moi',
        'dat ve moi',
        'dat lai',
        'lam lai',
        'lam tu dau',
        'bat dau lai',
        'khong dat nua',
        'dung lai',
        'huy luong',
        'doi chuyen',
        'reset',
    ].some(pattern => normalized.includes(pattern))
}

function isScheduleSearchRequest(message: string) {
    const normalized = normalize(message)
    const search = bookingFlow.extractTripSearchParams(message)

    return (
        Boolean(search.from || search.to || search.date) ||
        [
            'tim chuyen',
            'tim xe',
            'co xe',
            'dat ve',
            'lich trinh',
            'danh sach nha xe',
            'chuyen xe',
        ].some(pattern => normalized.includes(pattern))
    )
}

function isRoundTripRequest(message: string) {
    const normalized = normalize(message)
    return [
        'khu hoi',
        'hai chieu',
        'chieu ve',
        've quay lai',
        'return trip',
        'round trip',
        'roundtrip',
    ].some(pattern => normalized.includes(pattern))
}

function isPromotionRequest(message: string) {
    const normalized = normalize(message)
    return ['khuyen mai', 'uu dai', 'ma giam', 'giam gia', 'coupon', 'voucher', 'promotion'].some(
        pattern => normalized.includes(pattern)
    )
}

function isBookingLookupRequest(message: string) {
    const normalized = normalize(message)
    return [
        've cua toi',
        've da dat',
        've dang giu',
        'trang thai ve',
        'trang thai booking',
        'kiem tra booking',
        'booking cua toi',
    ].some(pattern => normalized.includes(pattern))
}

function isPaymentRequest(message: string) {
    const normalized = normalize(message)
    return [
        'thanh toan',
        'tra tien',
        'tinh tien',
        'chuyen khoan',
        'vnpay',
        'stripe',
        'payment',
        'pay',
        'tien mat',
        'cash',
        'the tin dung',
        'credit card',
    ].some(pattern => normalized.includes(pattern))
}

function normalize(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function getStringArg(args: Record<string, unknown>, key: string) {
    const value = args[key]
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function extractBookingCode(message: string) {
    return message.match(/(?:mã|ma|code|booking)\s*[:#-]?\s*([A-Z0-9_-]{4,})/iu)?.[1]
}

function formatBookingStatus(status: string) {
    if (status === 'pending') return 'đang giữ chỗ, chờ thanh toán'
    if (status === 'paid') return 'đã thanh toán'
    if (status === 'cancelled') return 'đã hủy'
    if (status === 'expired') return 'đã hết hạn'
    return status
}

function formatMoney(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function shorten(value: string, maxLength: number) {
    const normalized = value.replace(/\s+/g, ' ').trim()
    return normalized.length <= maxLength
        ? normalized
        : `${normalized.slice(0, maxLength - 3).trim()}...`
}
