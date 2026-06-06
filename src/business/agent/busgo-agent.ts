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
    const state = normalizeAgentState(
        getAgentSession(userId) ?? params.state ?? { stage: 'idle' as const }
    )

    if (isExpiredHold(state)) {
        agentSessions.delete(userId)
        return {
            message: 'Vé giữ đã hết hạn. Bạn muốn tìm chuyến mới từ đâu đến đâu?',
            state: { stage: 'idle' },
        }
    }

    if (isResetRequest(params.message)) {
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
        return saveResponse(params.userId, response)
    } catch {
        return saveResponse(params.userId, {
            message: 'Mình chưa xử lý được bước này, bạn thử lại giúp mình.',
            state: params.state,
        })
    }
}

async function executeDecision(params: {
    decision: BusGoAgentDecision
    message: string
    state: AiChatState
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    switch (params.decision.action) {
        case 'ASK_USER':
            return {
                message:
                    params.decision.reply?.trim() ||
                    'Bạn muốn tìm chuyến hay đặt vé từ đâu đến đâu?',
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
        (!state.stage || state.stage === 'idle') && !state.from && !state.to && !state.departureDate
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

    if (state.stage === 'need_date') return 'SEARCH_SCHEDULES'
    if (state.stage === 'schedules_listed') return 'LIST_PICKUP_STOPS'
    if (state.stage === 'pickup_listed') return 'LIST_DROPOFF_STOPS'
    if (state.stage === 'dropoff_listed') return 'CHECK_AVAILABLE_SEATS'
    if (state.stage === 'seat_listed') return 'CREATE_HOLD_BOOKING'
    if (state.stage === 'booking_created') return 'GET_BOOKING'
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
            from: state.from,
            to: state.to,
            departureDate: state.departureDate,
        }
    }

    return state
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
        'doi tuyen',
        'doi chuyen',
        'doi ngay',
        'reset',
    ].some(pattern => normalized.includes(pattern))
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
        .replace(/đ/g, 'd')
        .toLowerCase()
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
