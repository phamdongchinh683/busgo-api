import { BookingTicketId } from '../../database/booking/ticket/type.js'
import { BookingCouponId } from '../../database/booking/coupon/type.js'
import { BookingType } from '../../database/booking/booking/type.js'
import { OperationStationId } from '../../database/operation/station/type.js'
import { OperationTripId } from '../../database/operation/trip/type.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { OrganizationSeatId } from '../../database/organization/seat/type.js'
import type {
    AiChatScheduleOption,
    AiChatSeatOption,
    AiChatState,
    AiChatStopOption,
} from '../../model/body/chat/index.js'
import { UserInfo } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'
import * as booking from '../booking/booking.js'
import * as coupon from '../booking/coupon.js'
import * as ticket from '../booking/ticket.js'
import * as route from '../operation/route.js'
import * as operationTrip from '../operation/trip.js'
import * as tripSchedule from '../operation/trip-schedule.js'
import * as seat from '../organization/seat.js'

const MAX_CONTEXT_ITEMS = 5
const MAX_FLOW_OPTIONS = 5
const MAX_SEAT_OPTIONS = 36
const SEAT_OPTIONS_PER_LINE = 12
const BOOKING_FLOW_SESSION_TTL_MS = 30 * 60 * 1000
const bookingFlowSessions = new Map<number, BookingFlowSession>()
const TICKET_CANCELLATION_POLICY_CONTEXT =
    'Chinh sach huy ve: tro ly AI khong ho tro thuc hien huy ve truc tiep va khong noi khach tu huy tren app. Hay tra loi tu nhien rang hien minh chua the huy truc tiep; khach can lien he ho tro vien cua nha xe/cong ty van hanh ve do de duoc kiem tra va huy giup. Ve da thanh toan qua VNPay hoac the chi huy duoc truoc gio khoi hanh it nhat 24 gio. Ve tien mat khong can du 24 gio, nhung van khong huy duoc neu chuyen dang chay hoac da hoan thanh. Ve khu hoi khi huy se huy ca chieu di va chieu ve.'

type ContextBlock = {
    title: string
    content: string
}

type BookingFlowSession = {
    expiresAt: number
    state: AiChatState
}

type BookingFlowResponse = {
    clearSession?: boolean
    message: string
    state: AiChatState
}

type NumericEntities = {
    bookingId?: number
    companyId?: number
    couponId?: number
    fromStationId?: number
    orderTotal?: number
    scheduleId?: number
    stationId?: number
    stopOrder?: number
    stopOrderDropoff?: number
    stopOrderPickup?: number
    ticketId?: number
    tripId?: number
}

type TripSearchParams = {
    date?: Date
    from?: string
    to?: string
}

export async function reply(params: { userInfo: UserInfo; message: string; state?: AiChatState }) {
    const userId = Number(params.userInfo.id)
    const state = params.state ?? getBookingFlowSession(userId)
    const flowResponse = await handleCustomerBookingFlow({ ...params, state })

    if (flowResponse) {
        if (flowResponse.clearSession || shouldClearBookingFlowSession(flowResponse.state)) {
            bookingFlowSessions.delete(userId)
        } else {
            setBookingFlowSession(userId, flowResponse.state)
        }

        const { clearSession: _clearSession, ...response } = flowResponse
        return response
    }

    const companionResponse = getCompanionResponse(params.message, state)
    if (companionResponse) {
        return {
            message: companionResponse,
            ...(state ? { state } : {}),
        }
    }

    const context = await buildCustomerAssistantContext({ ...params, state })
    const response = await service.openai.chat({
        message: params.message,
        context,
    })

    return {
        ...response,
        ...(state ? { state } : {}),
    }
}

function getBookingFlowSession(userId: number) {
    const session = bookingFlowSessions.get(userId)

    if (!session) return undefined

    if (session.expiresAt <= Date.now()) {
        bookingFlowSessions.delete(userId)
        return undefined
    }

    return session.state
}

function setBookingFlowSession(userId: number, state: AiChatState) {
    if (shouldClearBookingFlowSession(state)) {
        bookingFlowSessions.delete(userId)
        return
    }

    const defaultExpiresAt = Date.now() + BOOKING_FLOW_SESSION_TTL_MS
    const bookingHoldExpiresAt = state.expiredAt?.getTime()

    bookingFlowSessions.set(userId, {
        state,
        expiresAt:
            state.stage === 'booking_created' && bookingHoldExpiresAt
                ? Math.min(defaultExpiresAt, bookingHoldExpiresAt)
                : defaultExpiresAt,
    })
}

function shouldClearBookingFlowSession(state: AiChatState) {
    if (!state.stage) return true
    if (state.stage !== 'idle') return false

    return !state.from && !state.to && !state.departureDate
}

function isBookingHoldExpired(state: AiChatState) {
    return (
        state.stage === 'booking_created' &&
        state.expiredAt !== undefined &&
        state.expiredAt.getTime() <= Date.now()
    )
}

async function handleCustomerBookingFlow(params: {
    userInfo: UserInfo
    message: string
    state?: AiChatState
}): Promise<BookingFlowResponse | undefined> {
    let state: AiChatState = params.state ?? { stage: 'idle' }
    if (state.departureDate && typeof state.departureDate === 'string') {
        state = { ...state, departureDate: new Date(state.departureDate) }
    }
    if (state.expiredAt && typeof state.expiredAt === 'string') {
        state = { ...state, expiredAt: new Date(state.expiredAt) }
    }
    const normalizedMessage = normalize(params.message)
    const tripSearch = extractTripSearchParams(params.message)
    const mergedTripSearch: TripSearchParams = {
        date: tripSearch.date ?? state.departureDate,
        from: tripSearch.from ?? state.from,
        to: tripSearch.to ?? state.to,
    }

    if (isBookingHoldExpired(state)) {
        return {
            clearSession: true,
            message:
                'Vé giữ đã hết hạn. Bạn muốn đặt chuyến mới thì gửi nơi đi, nơi đến và ngày đi nhé.',
            state: { stage: 'idle' as const },
        }
    }

    if (isResetFlowMessage(normalizedMessage)) {
        return {
            clearSession: true,
            message: 'Mình đã làm mới luồng đặt vé. Bạn muốn đi từ đâu đến đâu và ngày nào?',
            state: { stage: 'idle' as const },
        }
    }

    if (isCancelBookingFlowMessage(normalizedMessage, state)) {
        return {
            clearSession: true,
            message:
                'Mình đã bỏ luồng đặt vé hiện tại. Khi cần đặt chuyến mới, bạn gửi nơi đi, nơi đến và ngày đi nhé.',
            state: { stage: 'idle' as const },
        }
    }

    if (state.stage === 'booking_created' && isPaymentFlowMessage(normalizedMessage)) {
        return {
            clearSession: true,
            message: getPaymentGuidanceMessage(normalizedMessage),
            state: { stage: 'idle' as const },
        }
    }

    if (state.stage === 'coupon_prompted') {
        return safeBookingFlow(state, () =>
            handleCouponStep({
                message: params.message,
                state,
                userInfo: params.userInfo,
            })
        )
    }

    const shouldSearchSchedules =
        (shouldFetchTripSchedules(normalizedMessage, tripSearch) ||
            shouldContinueTripSearch(state, tripSearch)) &&
        Boolean(mergedTripSearch.from || mergedTripSearch.to)

    if (shouldSearchSchedules) {
        return safeBookingFlow(state, () => listSchedules(mergedTripSearch))
    }

    if (shouldFetchPickupStops(normalizedMessage) && (state.selectedSchedule || state.scheduleId)) {
        return safeBookingFlow(state, () =>
            listPickupStops({
                ...state,
                stage: 'pickup_listed',
            })
        )
    }

    if (state.selectedSchedule && shouldResolveScheduleDate(state)) {
        const selectedSchedule = state.selectedSchedule
        let departureDate = state.departureDate
        const messageDate = extractDate(params.message)
        if (messageDate) {
            departureDate = messageDate
        }

        if (departureDate) {
            if (
                utils.time.isPastDepartureDateTime({
                    departureDate,
                    departureTime: selectedSchedule.departureTime,
                })
            ) {
                return safeBookingFlow(state, () =>
                    listSchedulesAfterExpiredSelection({
                        state,
                        departureDate,
                        departureTime: selectedSchedule.departureTime,
                    })
                )
            }

            return safeBookingFlow(state, () =>
                listPickupStops({
                    ...state,
                    departureDate,
                    stage: 'pickup_listed',
                })
            )
        }

        if (isBookingFlowMessage(normalizedMessage, state)) {
            return {
                message: `Bạn chọn ${state.selectedSchedule.name} lúc ${formatTime(state.selectedSchedule.departureTime)}. Bạn muốn đi ngày nào?`,
                state: {
                    ...state,
                    stage: 'need_date' as const,
                },
            }
        }
    }

    if (state.pickupOptions?.length) {
        const selectedIndex = matchStopOption(params.message, state.pickupOptions)
        if (selectedIndex !== undefined) {
            return safeBookingFlow(state, () =>
                selectPickup({
                    selectedIndex,
                    state,
                })
            )
        }

        // Allow providing date even when asked for pickup (natural "hôm nay", "ngày mai" etc)
        if (state.selectedSchedule && !state.departureDate) {
            const selectedSchedule = state.selectedSchedule
            const departureDate = extractDate(params.message)
            if (departureDate) {
                if (
                    utils.time.isPastDepartureDateTime({
                        departureDate,
                        departureTime: selectedSchedule.departureTime,
                    })
                ) {
                    return safeBookingFlow(state, () =>
                        listSchedulesAfterExpiredSelection({
                            state,
                            departureDate,
                            departureTime: selectedSchedule.departureTime,
                        })
                    )
                }

                return safeBookingFlow(state, () =>
                    listPickupStops({
                        ...state,
                        departureDate,
                        stage: 'pickup_listed',
                    })
                )
            }
        }

        if (shouldAskForPickup(normalizedMessage, state)) {
            return {
                message: `Bạn chọn điểm đón nào?\n${formatStopOptions(state.pickupOptions)}`,
                state,
            }
        }
    }

    if (state.dropoffOptions?.length) {
        const selectedIndex = matchStopOption(params.message, state.dropoffOptions)
        if (selectedIndex !== undefined) {
            return safeBookingFlow(state, () =>
                selectDropoff({
                    selectedIndex,
                    state,
                })
            )
        }

        if (shouldAskForDropoff(normalizedMessage, state)) {
            const pickupLabel = state.selectedPickup
                ? `Bạn đã chọn điểm đón: ${formatStopLabel(state.selectedPickup)}.\n`
                : ''
            return {
                message: `${pickupLabel}Bạn chọn điểm trả nào?\n${formatStopOptions(state.dropoffOptions)}`,
                state,
            }
        }
    }

    if (shouldAskForDropoff(normalizedMessage, state) && hasDropoffLookupState(state)) {
        if (!state.dropoffOptions || state.dropoffOptions.length === 0) {
            return safeBookingFlow(state, () =>
                listDropoffStops({
                    ...state,
                    stage: 'dropoff_listed',
                })
            )
        }
        const pickupLabel = state.selectedPickup
            ? `Bạn đã chọn điểm đón: ${formatStopLabel(state.selectedPickup)}.\n`
            : ''
        return {
            message: `${pickupLabel}Bạn chọn điểm trả nào?\n${formatStopOptions(state.dropoffOptions)}`,
            state,
        }
    }

    if (state.stage === 'dropoff_listed' && state.dropoffOptions?.length) {
        const pickupLabel = state.selectedPickup
            ? `Bạn đã chọn điểm đón: ${formatStopLabel(state.selectedPickup)}.\n`
            : ''
        return {
            message: `${pickupLabel}Bạn chọn điểm trả nào?\n${formatStopOptions(state.dropoffOptions)}`,
            state,
        }
    }

    if (state.seatOptions?.length) {
        const selectedIndex = matchSeatOption(params.message, state.seatOptions)
        if (selectedIndex !== undefined) {
            return safeBookingFlow(state, () =>
                selectSeatAndAskCoupon({
                    selectedIndex,
                    state,
                })
            )
        }

        if (shouldAskForSeat(normalizedMessage, state)) {
            return {
                message: `Bạn chọn ghế nào?\n${formatSeatOptions(state.seatOptions)}`,
                state,
            }
        }
    }

    if (shouldAskForSeat(normalizedMessage, state) && hasSeatLookupState(state)) {
        if (!state.seatOptions || state.seatOptions.length === 0) {
            return safeBookingFlow(state, () =>
                listSeats({
                    ...state,
                    stage: 'seat_listed',
                })
            )
        }
        return {
            message: `Bạn chọn ghế nào?\n${formatSeatOptions(state.seatOptions)}`,
            state,
        }
    }

    if (state.scheduleOptions?.length) {
        const selectedIndex = matchScheduleOption(params.message, state.scheduleOptions)
        if (selectedIndex !== undefined) {
            return safeBookingFlow(state, () =>
                selectSchedule({
                    message: params.message,
                    selectedIndex,
                    state,
                })
            )
        }

        const departureDate = extractDate(params.message)
        if (departureDate) {
            return safeBookingFlow(state, () =>
                listSchedules({
                    from: state.from,
                    to: state.to,
                    date: departureDate,
                })
            )
        }

        if (shouldFetchPickupStops(normalizedMessage)) {
            return {
                message:
                    'Bạn chọn nhà xe trước nhé. Ví dụ: "chọn chuyến 1" hoặc "chọn nhà xe Phương Trang".',
                state,
            }
        }
    }

    if (isActiveBookingState(state)) {
        return {
            message: getCurrentFlowPrompt(state),
            state,
        }
    }

    if (isBookingFlowMessage(normalizedMessage, state) && state.stage === 'idle') {
        return {
            message:
                'Bạn muốn đi từ đâu đến đâu và ngày nào? Ví dụ: "Đà Nẵng đến Đắk Lắk ngày mai".',
            state,
        }
    }

    return undefined
}

async function safeBookingFlow(
    state: AiChatState,
    fn: () => Promise<BookingFlowResponse>
): Promise<BookingFlowResponse> {
    try {
        return await fn()
    } catch (error) {
        return {
            message:
                error instanceof Error
                    ? error.message
                    : 'Mình chưa xử lý được bước này, bạn thử chọn lại giúp mình.',
            state,
        }
    }
}

function getCompanionResponse(message: string, state?: AiChatState) {
    if (hasBusinessIntent(message, state)) {
        return undefined
    }

    if (isThanksMessage(message)) {
        return 'Không có gì. Khi cần tìm chuyến, xem vé, thanh toán hoặc hỏi chính sách hủy vé, bạn nhắn mình là được.'
    }

    if (isGreetingMessage(message)) {
        return 'Mình đây. Bạn muốn tìm chuyến, xem vé, thanh toán hay hỏi chính sách hủy vé?'
    }

    if (isHelpMessage(message)) {
        return 'Mình hỗ trợ tìm chuyến, chọn điểm đón/trả, chọn ghế, áp mã giảm giá, giữ vé, xem vé và giải thích chính sách hủy vé. Bạn muốn mình giúp việc nào trước?'
    }

    if (isConfusedMessage(message)) {
        return 'Không sao, mình đi từng bước với bạn. Nếu muốn đặt vé, bạn chỉ cần nhắn nơi đi, nơi đến và ngày đi.'
    }

    if (isWorriedMessage(message)) {
        return 'Mình nghe bạn. Phần đặt vé cứ để mình dẫn từng bước; bạn muốn mình giúp tìm chuyến hay kiểm tra vé trước?'
    }
}

function hasBusinessIntent(message: string, state?: AiChatState) {
    const normalizedMessage = normalize(message)
    const currentState = state ?? { stage: 'idle' as const }
    const tripSearch = extractTripSearchParams(message)

    return (
        isBookingFlowMessage(normalizedMessage, currentState) ||
        shouldFetchTripSchedules(normalizedMessage, tripSearch) ||
        shouldFetchPickupStops(normalizedMessage) ||
        shouldAskForDropoff(normalizedMessage, currentState) ||
        shouldAskForSeat(normalizedMessage, currentState) ||
        shouldFetchCoupon(normalizedMessage) ||
        shouldFetchTicket(normalizedMessage) ||
        isPaymentFlowMessage(normalizedMessage)
    )
}

function isGreetingMessage(message: string) {
    const normalizedMessage = normalizeSearch(message)
    return (
        ['chao', 'chao ban', 'hello', 'hi', 'alo', 'ban oi', 'admin oi', 'tro ly oi'].includes(
            normalizedMessage
        ) || containsAny(normalizedMessage, ['xin chao', 'chào bạn', 'hello busgo'])
    )
}

function isThanksMessage(message: string) {
    return containsAny(message, [
        'cam on',
        'cảm ơn',
        'thanks',
        'thank you',
        'ok cam on',
        'ok cảm ơn',
        'duoc roi',
        'được rồi',
        'tot qua',
        'tốt quá',
    ])
}

function isHelpMessage(message: string) {
    return containsAny(message, [
        'giup voi',
        'giúp với',
        'ho tro toi',
        'hỗ trợ tôi',
        'ho tro minh',
        'hỗ trợ mình',
        'can ban giup',
        'cần bạn giúp',
        'lam gi duoc',
        'làm gì được',
        'ban lam duoc gi',
        'bạn làm được gì',
    ])
}

function isConfusedMessage(message: string) {
    return containsAny(message, [
        'khong hieu',
        'không hiểu',
        'roi qua',
        'rối quá',
        'kho qua',
        'khó quá',
        'khong biet lam sao',
        'không biết làm sao',
        'toi khong biet',
        'tôi không biết',
        'minh khong biet',
        'mình không biết',
    ])
}

function isWorriedMessage(message: string) {
    return containsAny(message, [
        'lo qua',
        'lo quá',
        'so qua',
        'sợ quá',
        'met qua',
        'mệt quá',
        'bun qua',
        'buồn quá',
        'stress',
        'can nguoi giup',
        'cần người giúp',
    ])
}

async function listSchedules(search: TripSearchParams) {
    if (!search.from || !search.to) {
        return {
            message: 'Bạn muốn đi từ đâu đến đâu?',
            state: {
                stage: 'idle' as const,
                from: search.from,
                to: search.to,
                departureDate: search.date,
            },
        }
    }

    const resolvedSearch = await resolveTripSearchParams(search)
    const result = await tripSchedule.getTripSchedules({
        limit: 10,
        orderBy: 'asc',
        ...(resolvedSearch.from ? { from: resolvedSearch.from } : {}),
        ...(resolvedSearch.to ? { to: resolvedSearch.to } : {}),
        ...(resolvedSearch.date ? { date: resolvedSearch.date } : {}),
    })

    const scheduleOptions = result.trip.slice(0, MAX_FLOW_OPTIONS).map(item => ({
        scheduleId: item.id,
        companyId: item.companyId,
        name: item.name,
        fromLocation: item.fromLocation,
        toLocation: item.toLocation,
        departureTime: item.departureTime,
        startDate: String(item.startDate),
        endDate: String(item.endDate),
        totalStars: item.totalStars ?? null,
    }))

    const state: AiChatState = {
        stage: 'schedules_listed',
        from: resolvedSearch.from ?? search.from,
        to: resolvedSearch.to ?? search.to,
        departureDate: resolvedSearch.date,
        scheduleOptions,
    }

    if (scheduleOptions.length === 0) {
        return {
            message: `Mình chưa tìm thấy nhà xe cho tuyến ${search.from} -> ${search.to}${search.date ? ` ngày ${formatDisplayDate(search.date)}` : ''}. Bạn thử đổi ngày hoặc tuyến khác nhé.`,
            state,
        }
    }

    return {
        message: [
            `Mình tìm thấy ${scheduleOptions.length} nhà xe cho tuyến ${state.from} -> ${state.to}${state.departureDate ? ` ngày ${formatDisplayDate(state.departureDate)}` : ''}:`,
            formatScheduleOptions(scheduleOptions),
            state.departureDate
                ? 'Bạn chọn nhà xe nào?'
                : 'Bạn chọn nhà xe nào và muốn đi ngày nào?',
        ].join('\n'),
        state,
    }
}

async function selectSchedule(params: {
    message: string
    selectedIndex: number
    state: AiChatState
}) {
    const selectedSchedule = params.state.scheduleOptions?.[params.selectedIndex]
    if (!selectedSchedule) {
        return {
            message:
                'Mình không thấy lựa chọn nhà xe đó, bạn chọn lại theo số trong danh sách nhé.',
            state: params.state,
        }
    }

    const departureDate = extractDate(params.message) ?? params.state.departureDate
    const state: AiChatState = {
        ...params.state,
        stage: departureDate ? 'pickup_listed' : 'need_date',
        selectedSchedule,
        scheduleId: selectedSchedule.scheduleId,
        companyId: selectedSchedule.companyId,
        departureDate,
        pickupOptions: undefined,
        selectedPickup: undefined,
        dropoffOptions: undefined,
        selectedDropoff: undefined,
        seatOptions: undefined,
        selectedSeat: undefined,
        tripId: undefined,
        fromStationId: undefined,
        stopOrder: undefined,
        stopOrderPickup: undefined,
        stopOrderDropoff: undefined,
    }

    if (!departureDate) {
        return {
            message: `Bạn chọn ${selectedSchedule.name} lúc ${formatTime(selectedSchedule.departureTime)}. Bạn muốn đi ngày nào?`,
            state,
        }
    }

    if (
        utils.time.isPastDepartureDateTime({
            departureDate,
            departureTime: selectedSchedule.departureTime,
        })
    ) {
        return listSchedulesAfterExpiredSelection({
            state,
            departureDate,
            departureTime: selectedSchedule.departureTime,
        })
    }

    return listPickupStops(state)
}

async function listSchedulesAfterExpiredSelection(params: {
    state: AiChatState
    departureDate: Date
    departureTime: string
}) {
    const result = await listSchedules({
        from: params.state.from ?? params.state.selectedSchedule?.fromLocation,
        to: params.state.to ?? params.state.selectedSchedule?.toLocation,
        date: params.departureDate,
    })

    return {
        message: [
            `Chuyến lúc ${formatTime(params.departureTime)} đã quá giờ khởi hành ngày ${formatDisplayDate(params.departureDate)}.`,
            result.message,
        ].join('\n'),
        state: result.state,
    }
}

async function listPickupStops(state: AiChatState) {
    const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId

    if (!scheduleId) {
        return {
            message: 'Bạn chọn nhà xe trước nhé.',
            state,
        }
    }

    const result = await tripSchedule.getPickupStops(scheduleId)
    const pickupOptions = (
        await Promise.all(
            result.tripStops.map(async item => {
                const dropoffResult = await tripSchedule.getDropoffStops(
                    scheduleId,
                    item.stationId,
                    item.stopOrder
                )

                if (dropoffResult.tripStops.length === 0) {
                    return undefined
                }

                return {
                    stationId: item.stationId,
                    stopOrder: item.stopOrder,
                    address: item.address,
                    city: item.city,
                }
            })
        )
    )
        .filter((item): item is AiChatStopOption => item !== undefined)
        .slice(0, MAX_FLOW_OPTIONS)

    const nextState: AiChatState = {
        ...state,
        stage: 'pickup_listed',
        scheduleId,
        pickupOptions,
        selectedPickup: undefined,
        dropoffOptions: undefined,
        selectedDropoff: undefined,
        seatOptions: undefined,
        selectedSeat: undefined,
        scheduleOptions: undefined, // clear previous to prevent re-matching old schedules
    }

    if (pickupOptions.length === 0) {
        return {
            message: 'Chuyến này hiện chưa có điểm đón phù hợp để đặt vé.',
            state: nextState,
        }
    }

    return {
        message: [
            state.selectedSchedule
                ? `Bạn chọn ${state.selectedSchedule.name} lúc ${formatTime(state.selectedSchedule.departureTime)}${state.departureDate ? ` ngày ${formatDisplayDate(state.departureDate)}` : ''}.`
                : undefined,
            `Điểm đón hiện có:\n${formatStopOptions(pickupOptions)}`,
            'Bạn muốn đón ở điểm nào?',
        ]
            .filter(Boolean)
            .join('\n'),
        state: nextState,
    }
}

async function selectPickup(params: { selectedIndex: number; state: AiChatState }) {
    const selectedPickup = params.state.pickupOptions?.[params.selectedIndex]
    const scheduleId = params.state.selectedSchedule?.scheduleId ?? params.state.scheduleId

    if (!selectedPickup || !scheduleId) {
        return {
            message: 'Mình không thấy điểm đón đó, bạn chọn lại theo số trong danh sách nhé.',
            state: params.state,
        }
    }

    return listDropoffStops({
        ...params.state,
        stage: 'dropoff_listed',
        scheduleId,
        selectedPickup,
        fromStationId: selectedPickup.stationId,
        stopOrder: selectedPickup.stopOrder,
        stopOrderPickup: selectedPickup.stopOrder,
    })
}

async function listDropoffStops(state: AiChatState) {
    const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId
    const fromStationId = state.selectedPickup?.stationId ?? state.fromStationId
    const stopOrder = state.selectedPickup?.stopOrder ?? state.stopOrder ?? state.stopOrderPickup

    if (!scheduleId || !fromStationId || stopOrder === undefined) {
        return {
            message: 'Bạn chọn điểm đón trước nhé.',
            state,
        }
    }

    const result = await tripSchedule.getDropoffStops(scheduleId, fromStationId, stopOrder)
    const dropoffOptions = result.tripStops.slice(0, MAX_FLOW_OPTIONS).map(item => ({
        stationId: item.stationId,
        stopOrder: item.stopOrder,
        address: item.address,
        city: item.city,
        price: item.price,
    }))
    const nextState: AiChatState = {
        ...state,
        stage: 'dropoff_listed',
        scheduleId,
        fromStationId,
        stopOrder,
        stopOrderPickup: stopOrder,
        dropoffOptions,
        selectedDropoff: undefined,
        seatOptions: undefined,
        selectedSeat: undefined,
        pickupOptions: undefined, // clear previous to avoid re-triggering pickup matching later
        scheduleOptions: undefined,
    }

    if (dropoffOptions.length === 0) {
        const availablePickupResponse = await listPickupStops({
            ...state,
            selectedPickup: undefined,
            fromStationId: undefined,
            stopOrder: undefined,
            stopOrderPickup: undefined,
        })

        return {
            message: [
                'Điểm này chưa có điểm trả phù hợp, bạn chọn lại điểm đón khác nhé.',
                availablePickupResponse.message,
            ].join('\n'),
            state: availablePickupResponse.state,
        }
    }

    return {
        message: [
            nextState.selectedPickup
                ? `Bạn đã chọn điểm đón: ${formatStopLabel(nextState.selectedPickup)}.`
                : undefined,
            `Điểm trả phù hợp:\n${formatStopOptions(dropoffOptions)}`,
            'Bạn chọn điểm trả nào?',
        ]
            .filter(Boolean)
            .join('\n'),
        state: nextState,
    }
}

async function selectDropoff(params: { selectedIndex: number; state: AiChatState }) {
    const selectedDropoff = params.state.dropoffOptions?.[params.selectedIndex]
    if (!selectedDropoff) {
        return {
            message: 'Mình không thấy điểm trả đó, bạn chọn lại theo số trong danh sách nhé.',
            state: params.state,
        }
    }

    const state: AiChatState = {
        ...params.state,
        stage: 'seat_listed',
        selectedDropoff,
        stopOrderDropoff: selectedDropoff.stopOrder,
        seatOptions: undefined,
        selectedSeat: undefined,
        dropoffOptions: undefined, // clear so later stages don't re-match on it
        pickupOptions: undefined,
    }

    return listSeats(state)
}

async function listSeats(state: AiChatState) {
    const stopOrderPickup = state.selectedPickup?.stopOrder ?? state.stopOrderPickup
    const stopOrderDropoff = state.selectedDropoff?.stopOrder ?? state.stopOrderDropoff

    if (stopOrderPickup === undefined || stopOrderDropoff === undefined) {
        return {
            message: 'Bạn chọn điểm đón và điểm trả trước nhé.',
            state,
        }
    }

    let tripId = state.tripId
    let companyId = state.companyId ?? state.selectedSchedule?.companyId

    if (!tripId) {
        const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId

        if (!scheduleId || !companyId || !state.departureDate) {
            return {
                message: 'Bạn chọn nhà xe và ngày đi trước để mình kiểm tra ghế trống nhé.',
                state,
            }
        }

        const preparedTrip = await operationTrip.prepareTrip({
            scheduleId,
            companyId,
            departureDate: state.departureDate,
        })

        tripId = preparedTrip.id
        companyId = preparedTrip.companyId
    }

    const result = await seat.getSeats({
        id: OperationTripId.parse(tripId),
        stopOrderPickup,
        stopOrderDropoff,
    })
    const seatOptions = result.seats.slice(0, MAX_SEAT_OPTIONS).map(item => ({
        seatId: item.id,
        seatNumber: item.seatNumber,
        type: item.type,
    }))
    const nextState: AiChatState = {
        ...state,
        stage: 'seat_listed',
        tripId,
        companyId,
        stopOrderPickup,
        stopOrderDropoff,
        seatOptions,
        pickupOptions: undefined,
        dropoffOptions: undefined,
        scheduleOptions: undefined,
    }

    if (seatOptions.length === 0) {
        return {
            message: 'Chặng này hiện chưa còn ghế trống, bạn thử chọn điểm đón/trả khác nhé.',
            state: nextState,
        }
    }

    return {
        message: [
            state.selectedDropoff
                ? `Bạn đã chọn điểm trả: ${formatStopLabel(state.selectedDropoff)}.`
                : undefined,
            `Ghế còn trống:\n${formatSeatOptions(seatOptions)}`,
            'Bạn chọn ghế nào? Ví dụ: "5B" hoặc "tầng 2 ghế 5". Sau khi chọn, mình sẽ giữ vé trong 10 phút.',
        ]
            .filter(Boolean)
            .join('\n'),
        state: nextState,
    }
}

async function selectSeatAndAskCoupon(params: { selectedIndex: number; state: AiChatState }) {
    const selectedSeat = params.state.seatOptions?.[params.selectedIndex]

    if (
        !selectedSeat ||
        !params.state.tripId ||
        !params.state.companyId ||
        !params.state.selectedPickup ||
        !params.state.selectedDropoff
    ) {
        return {
            message: 'Mình chưa đủ thông tin để giữ vé, bạn chọn lại chuyến từ đầu giúp mình.',
            state: params.state,
        }
    }

    const state: AiChatState = {
        ...params.state,
        stage: 'coupon_prompted',
        selectedSeat,
        orderTotal: params.state.selectedDropoff.price,
        seatOptions: undefined,
    }

    return {
        message: [
            `Bạn đã chọn ghế ${selectedSeat.seatNumber}.`,
            state.orderTotal !== undefined
                ? `Tạm tính: ${formatMoney(state.orderTotal)}.`
                : undefined,
            'Bạn có mã giảm giá không? Nếu có, nhập mã; nếu không, nhắn "không có" để mình giữ vé trong 10 phút.',
        ]
            .filter(Boolean)
            .join('\n'),
        state,
    }
}

async function handleCouponStep(params: {
    message: string
    state: AiChatState
    userInfo: UserInfo
}) {
    if (isSkipCouponMessage(params.message)) {
        return createBookingFromState({
            state: {
                ...params.state,
                couponId: undefined,
            },
            userInfo: params.userInfo,
        })
    }

    const code = extractCouponCode(params.message)

    if (!code) {
        return {
            message: 'Bạn nhập mã giảm giá, hoặc nhắn "không có" để bỏ qua nhé.',
            state: params.state,
        }
    }

    if (!params.state.companyId || params.state.orderTotal === undefined) {
        return {
            message:
                'Mình chưa đủ thông tin để kiểm tra mã giảm giá. Bạn nhắn "không có" để tiếp tục giữ vé nhé.',
            state: params.state,
        }
    }

    try {
        const result = await coupon.getCouponByCode({
            code,
            companyId: OrganizationBusCompanyId.parse(params.state.companyId),
            orderTotal: params.state.orderTotal,
        })

        return createBookingFromState({
            couponMessage: `Đã áp mã ${code}: giảm ${formatMoney(result.discountAmount)}, còn ${formatMoney(result.finalTotal)}.`,
            state: {
                ...params.state,
                couponId: result.id,
            },
            userInfo: params.userInfo,
        })
    } catch (error) {
        return {
            message: [
                error instanceof Error
                    ? `Mã ${code} chưa dùng được: 'không khả dụng`
                    : `Mã ${code} chưa dùng được.`,
                'Bạn nhập mã khác, hoặc nhắn "không có" để bỏ qua.',
            ].join('\n'),
            state: params.state,
        }
    }
}

async function createBookingFromState(params: {
    couponMessage?: string
    state: AiChatState
    userInfo: UserInfo
}) {
    const selectedSeat = params.state.selectedSeat

    if (
        !selectedSeat ||
        !params.state.tripId ||
        !params.state.companyId ||
        !params.state.selectedPickup ||
        !params.state.selectedDropoff
    ) {
        return {
            message: 'Mình chưa đủ thông tin để giữ vé, bạn chọn lại chuyến từ đầu giúp mình.',
            state: params.state,
        }
    }

    const result = await booking.initBooking(
        {
            ...(params.state.couponId
                ? { couponId: BookingCouponId.parse(params.state.couponId) }
                : {}),
            type: BookingType.enum.one_way,
            outBound: {
                tripId: OperationTripId.parse(params.state.tripId),
                seatId: OrganizationSeatId.parse(selectedSeat.seatId),
                fromStationId: OperationStationId.parse(params.state.selectedPickup.stationId),
                companyId: OrganizationBusCompanyId.parse(params.state.companyId),
                toStationId: OperationStationId.parse(params.state.selectedDropoff.stationId),
            },
        },
        params.userInfo.id
    )

    const state: AiChatState = {
        ...params.state,
        stage: 'booking_created',
        selectedSeat,
        bookingId: result?.id,
        expiredAt: result?.expiredAt ?? undefined,
        seatOptions: undefined,
    }

    return {
        message: [
            params.couponMessage,
            `Mình đã giữ ghế ${selectedSeat.seatNumber} trong 10 phút.`,
            'Bạn vào Profile > Vé > Đã giữ chỗ để mở vé này và chọn phương thức thanh toán. Vé sẽ tự hủy sau 10 phút nếu chưa được xác nhận.',
        ]
            .filter(Boolean)
            .join('\n'),
        state,
    }
}

function isResetFlowMessage(message: string) {
    return containsAny(message, [
        'dat lai',
        'đặt lại',
        'lam lai',
        'làm lại',
        'lam tu dau',
        'làm từ đầu',
        'bat dau lai',
        'bắt đầu lại',
        'xoa lua chon',
        'xóa lựa chọn',
        'doi tuyen',
        'đổi tuyến',
        'doi chuyen',
        'đổi chuyến',
        'dat ve moi',
        'đặt vé mới',
        'dat ve khac',
        'đặt vé khác',
        'dat chuyen moi',
        'đặt chuyến mới',
        'dat chuyen khac',
        'đặt chuyến khác',
        'chuyen moi',
        'chuyến mới',
        'chuyen khac',
        'chuyến khác',
        'reset',
    ])
}

function isCancelBookingFlowMessage(message: string, state: AiChatState) {
    if (!isActiveBookingState(state)) return false

    return containsAny(message, [
        'khong dat nua',
        'không đặt nữa',
        'bo qua',
        'bỏ qua',
        'thoi',
        'thôi',
        'dung lai',
        'dừng lại',
        'khong can nua',
        'không cần nữa',
        'thoat dat ve',
        'thoát đặt vé',
        'huy luong',
        'hủy luồng',
        'huy dat ve nay',
        'hủy đặt vé này',
    ])
}

function isPaymentFlowMessage(message: string) {
    return (
        containsAny(message, [
            'thanh toan',
            'thanh toán',
            'tra bang',
            'trả bằng',
            'tra tien',
            'trả tiền',
            'tinh tien',
            'tính tiền',
            'chuyen khoan',
            'chuyển khoản',
            'quet the',
            'quẹt thẻ',
            'pay',
            'payment',
            'vnpay',
            'thanh toan the',
            'thanh toán thẻ',
            'tra bang the',
            'trả bằng thẻ',
            'card',
            'stripe',
            'cash',
            'tien mat',
            'tiền mặt',
            'tiep',
            'tiếp',
            'hoan tat',
            'hoàn tất',
            'xong ve',
            'xong vé',
        ]) || containsAnyWord(message, ['the', 'thẻ'])
    )
}

function isSkipCouponMessage(message: string) {
    return (
        containsAny(message, [
            'khong',
            'không',
            'khong co',
            'không có',
            'bo qua',
            'bỏ qua',
            'skip',
            'thoi',
            'thôi',
            'khoi',
            'khỏi',
            'khong can',
            'không cần',
            'de sau',
            'để sau',
            'cu tiep tuc',
            'cứ tiếp tục',
            'khong dung ma',
            'không dùng mã',
            'khong co ma',
            'không có mã',
        ]) || containsAnyWord(message, ['no'])
    )
}

function getPaymentGuidanceMessage(message: string) {
    if (containsAny(message, ['cash', 'tien mat', 'tiền mặt'])) {
        return 'Bạn vào Profile > Vé > Đã giữ chỗ, mở vé này và chọn tiền mặt. Vé vẫn chỉ được giữ 10 phút và sẽ tự hủy nếu chưa được xác nhận.'
    }

    if (containsAny(message, ['vnpay'])) {
        return 'Bạn vào Profile > Vé > Đã giữ chỗ, mở vé này rồi chọn VNPay để mở trang thanh toán. Vé đang được giữ 10 phút.'
    }

    if (
        containsAny(message, [
            'thanh toan the',
            'thanh toán thẻ',
            'tra bang the',
            'trả bằng thẻ',
            'card',
            'stripe',
        ]) ||
        containsAnyWord(message, ['the', 'thẻ'])
    ) {
        return 'Bạn vào Profile > Vé > Đã giữ chỗ, mở vé này rồi chọn thanh toán thẻ. Vé đang được giữ 10 phút.'
    }

    return 'Mình sẽ không hỗ trợ thanh toán trực tiếp. Bạn vào Profile > Vé của tôi > Chọn đang giữ chỗ chọn phương thức thanh toán VNPay, thẻ hoặc tiền mặt khi lên xe.'
}

function isActiveBookingState(state: AiChatState) {
    return Boolean(state.stage && state.stage !== 'idle')
}

function shouldContinueTripSearch(state: AiChatState, search: TripSearchParams) {
    return (
        state.stage === 'idle' &&
        Boolean(state.from || state.to || state.departureDate) &&
        Boolean(search.from || search.to || search.date)
    )
}

function shouldResolveScheduleDate(state: AiChatState) {
    return (
        state.stage === 'need_date' ||
        (state.selectedSchedule &&
            !state.departureDate &&
            !state.pickupOptions?.length &&
            !state.selectedPickup &&
            !state.dropoffOptions?.length &&
            !state.selectedDropoff &&
            !state.seatOptions?.length)
    )
}

function getCurrentFlowPrompt(state: AiChatState) {
    if (state.stage === 'schedules_listed' && state.scheduleOptions?.length) {
        return [
            state.departureDate
                ? `Bạn đang chọn chuyến ngày ${formatDisplayDate(state.departureDate)}.`
                : 'Bạn chọn nhà xe và ngày đi nhé.',
            `Các nhà xe hiện có:\n${formatScheduleOptions(state.scheduleOptions)}`,
            state.departureDate
                ? 'Bạn muốn chọn nhà xe nào?'
                : 'Bạn có thể nhắn như "chọn chuyến đầu ngày mai".',
        ].join('\n')
    }

    if (state.stage === 'need_date' && state.selectedSchedule) {
        return `Bạn chọn ${state.selectedSchedule.name} lúc ${formatTime(state.selectedSchedule.departureTime)}. Bạn muốn đi ngày nào?`
    }

    if (state.stage === 'pickup_listed' && state.pickupOptions?.length) {
        return `Bạn muốn đón ở điểm nào?\n${formatStopOptions(state.pickupOptions)}`
    }

    if (state.stage === 'dropoff_listed' && state.dropoffOptions?.length) {
        return `Bạn muốn trả ở điểm nào?\n${formatStopOptions(state.dropoffOptions)}`
    }

    if (state.stage === 'seat_listed' && state.seatOptions?.length) {
        return `Bạn chọn ghế nào?\n${formatSeatOptions(state.seatOptions)}`
    }

    if (state.stage === 'coupon_prompted') {
        return 'Bạn có mã giảm giá không? Nếu có, nhập mã; nếu không, nhắn "không có" để mình giữ vé trong 10 phút.'
    }

    if (state.stage === 'booking_created') {
        return 'Vé đang được giữ 10 phút. Bạn vào Profile > Vé của tôi > Đã giữ chỗ để mở vé và chọn phương thức thanh toán để hoàn tất thanh toán nhé.'
    }

    return 'Bạn muốn đi từ đâu đến đâu và ngày nào?'
}

function isBookingFlowMessage(message: string, state: AiChatState) {
    if (state.stage && state.stage !== 'idle') return true

    return containsAny(message, [
        'dat ve',
        'đặt vé',
        'mua ve',
        'mua vé',
        'book ve',
        'book vé',
        'giu cho',
        'giữ chỗ',
        'dat cho',
        'đặt chỗ',
        'tim chuyen',
        'tìm chuyến',
        'kiem chuyen',
        'kiếm chuyến',
        'tim xe',
        'tìm xe',
        'kiem xe',
        'kiếm xe',
        'co xe',
        'có xe',
        'lich xe',
        'lịch xe',
        'nha xe',
        'nhà xe',
        'chuyen xe',
        'chuyến xe',
        'diem don',
        'điểm đón',
        'diem tra',
        'điểm trả',
        'ghe',
        'ghế',
        'giu ve',
        'giữ vé',
        'tao ve',
        'tạo vé',
        'den',
        'đến',
    ])
}

function shouldAskForPickup(message: string, state: AiChatState) {
    return state.stage === 'pickup_listed' || shouldFetchPickupStops(message)
}

function shouldAskForDropoff(message: string, state: AiChatState) {
    return (
        state.stage === 'dropoff_listed' ||
        containsAny(message, [
            'diem tra',
            'điểm trả',
            'dropoff',
            'tra o dau',
            'trả ở đâu',
            'xuong o dau',
            'xuống ở đâu',
            'diem xuong',
            'điểm xuống',
            'ben xuong',
            'bến xuống',
            'tra khach',
            'trả khách',
        ])
    )
}

function shouldAskForSeat(message: string, state: AiChatState) {
    return (
        state.stage === 'seat_listed' ||
        containsAny(message, [
            'ghe',
            'ghế',
            'seat',
            'cho ngoi',
            'chỗ ngồi',
            'chon cho',
            'chọn chỗ',
            'giuong',
            'giường',
            'nam',
            'nằm',
            'con cho',
            'còn chỗ',
        ])
    )
}

function hasDropoffLookupState(state: AiChatState) {
    const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId
    const fromStationId = state.selectedPickup?.stationId ?? state.fromStationId
    const stopOrder = state.selectedPickup?.stopOrder ?? state.stopOrder ?? state.stopOrderPickup

    return Boolean(scheduleId && fromStationId && stopOrder !== undefined)
}

function hasSeatLookupState(state: AiChatState) {
    const stopOrderPickup = state.selectedPickup?.stopOrder ?? state.stopOrderPickup
    const stopOrderDropoff = state.selectedDropoff?.stopOrder ?? state.stopOrderDropoff
    const canUseExistingTrip = Boolean(state.tripId)
    const canPrepareTrip = Boolean(
        (state.selectedSchedule?.scheduleId ?? state.scheduleId) &&
        (state.companyId ?? state.selectedSchedule?.companyId) &&
        state.departureDate
    )

    return (
        stopOrderPickup !== undefined &&
        stopOrderDropoff !== undefined &&
        (canUseExistingTrip || canPrepareTrip)
    )
}

function matchScheduleOption(message: string, options: AiChatScheduleOption[]) {
    const normalizedMessage = normalizeSearch(message)

    if (containsAny(normalizedMessage, ['som nhat', 'sớm nhất', 'chuyen som', 'chuyến sớm'])) {
        return findScheduleByTime(options, 'asc')
    }

    if (
        containsAny(normalizedMessage, [
            'tre nhat',
            'trễ nhất',
            'muon nhat',
            'muộn nhất',
            'chuyen cuoi',
            'chuyến cuối',
        ])
    ) {
        return findScheduleByTime(options, 'desc')
    }

    const timeRangeIndex = findScheduleByTimeRange(options, normalizedMessage)
    if (timeRangeIndex !== undefined) return timeRangeIndex

    const choiceIndex = extractChoiceIndex(message, options.length)
    if (choiceIndex !== undefined) return choiceIndex

    const time = extractTimeText(normalizedMessage)
    if (time) {
        const matchedTimeIndex = options.findIndex(item => formatTime(item.departureTime) === time)
        if (matchedTimeIndex >= 0) return matchedTimeIndex
    }

    return findBestTextMatchIndex(
        message,
        options.map(item =>
            [item.name, item.fromLocation, item.toLocation, formatTime(item.departureTime)].join(
                ' '
            )
        )
    )
}

function matchStopOption(message: string, options: AiChatStopOption[]) {
    const normalizedMessage = normalizeSearch(message)

    if (containsAny(normalizedMessage, ['re nhat', 'rẻ nhất', 'gia thap', 'giá thấp'])) {
        const pricedOptions = options
            .map((item, index) => ({ index, price: item.price }))
            .filter((item): item is { index: number; price: number } => item.price !== undefined)

        if (pricedOptions.length > 0) {
            return pricedOptions.reduce((best, item) => (item.price < best.price ? item : best))
                .index
        }
    }

    const choiceIndex = extractChoiceIndex(message, options.length)
    if (choiceIndex !== undefined) return choiceIndex

    return findBestTextMatchIndex(
        message,
        options.map(item => `${item.address} ${item.city}`)
    )
}

function matchSeatOption(message: string, options: AiChatSeatOption[]) {
    const normalizedMessage = normalizeSearch(message)
    const matchedSeatIndex = options.findIndex(item =>
        normalizedMessage.includes(normalizeSearch(item.seatNumber))
    )

    if (matchedSeatIndex >= 0) return matchedSeatIndex

    const floorSeatNumber = extractFloorSeatNumber(normalizedMessage)
    if (floorSeatNumber) {
        const matchedFloorSeatIndex = options.findIndex(
            item => normalizeSearch(item.seatNumber) === normalizeSearch(floorSeatNumber)
        )

        if (matchedFloorSeatIndex >= 0) return matchedFloorSeatIndex
    }

    return extractChoiceIndex(message, options.length)
}

function extractFloorSeatNumber(message: string) {
    const match = message.match(/\b(?:tang|tầng)\s*([12])\D+(?:ghe|ghế)?\s*(\d{1,2})\b/)
    if (!match) return undefined

    const suffix = match[1] === '1' ? 'A' : 'B'
    return `${Number(match[2])}${suffix}`
}

function extractChoiceIndex(message: string, totalOptions: number) {
    if (totalOptions <= 0) return undefined

    const normalizedMessage = normalizeSearch(message)

    if (
        containsAny(normalizedMessage, [
            'cuoi cung',
            'cuối cùng',
            'cai cuoi',
            'cái cuối',
            'muc cuoi',
            'mục cuối',
            'sau cung',
            'sau cùng',
            'diem cuoi',
            'điểm cuối',
            'chuyen cuoi',
            'chuyến cuối',
            'last',
        ])
    ) {
        return totalOptions - 1
    }

    const wordChoices: Array<[string[], number]> = [
        [['dau tien', 'đầu tiên', 'cai dau', 'cái đầu', 'thu nhat', 'thứ nhất', 'first'], 0],
        [['thu hai', 'thứ hai', 'cai hai', 'cái hai', 'second'], 1],
        [['thu ba', 'thứ ba', 'cai ba', 'cái ba', 'third'], 2],
        [['thu tu', 'thứ tư', 'cai bon', 'cái bốn', 'fourth'], 3],
        [['thu nam', 'thứ năm', 'cai nam', 'cái năm', 'fifth'], 4],
    ]

    for (const [patterns, index] of wordChoices) {
        if (index < totalOptions && patterns.some(pattern => normalizedMessage.includes(pattern))) {
            return index
        }
    }

    const explicitChoiceMatch = normalizedMessage.match(
        /\b(?:chon|lua chon|so|muc|diem don|diem tra|diem|chuyen|nha xe|ghe|seat|option)\s*(\d{1,2})\b/
    )
    const bareNumberMatch = normalizedMessage.match(/^(\d{1,2})$/)
    const numberMatch = explicitChoiceMatch ?? bareNumberMatch

    if (numberMatch) {
        const index = Number(numberMatch[1]) - 1
        if (index >= 0 && index < totalOptions) return index
    }

    // Fallback: chấp nhận bất kỳ số nào trong tin nhắn (ví dụ: "1.", "chọn điểm 1", "option 1")
    const anyNumberMatch = normalizedMessage.match(/\b(\d{1,2})\b/)
    if (anyNumberMatch) {
        const index = Number(anyNumberMatch[1]) - 1
        if (index >= 0 && index < totalOptions) return index
    }

    return undefined
}

function findScheduleByTime(options: AiChatScheduleOption[], order: 'asc' | 'desc') {
    const sorted = options
        .map((item, index) => ({ index, time: item.departureTime }))
        .sort((left, right) => left.time.localeCompare(right.time))

    return order === 'asc' ? sorted[0]?.index : sorted[sorted.length - 1]?.index
}

function findScheduleByTimeRange(options: AiChatScheduleOption[], message: string) {
    const ranges: Array<[string[], number, number]> = [
        [['sang', 'sáng', 'buoi sang', 'buổi sáng', 'morning'], 5, 11],
        [['trua', 'trưa', 'buoi trua', 'buổi trưa', 'noon'], 11, 13],
        [['chieu', 'chiều', 'buoi chieu', 'buổi chiều', 'afternoon'], 13, 18],
        [['buoi toi', 'buổi tối', 'evening'], 18, 22],
        [['dem', 'đêm', 'khuya', 'night'], 22, 24],
    ]

    for (const [patterns, startHour, endHour] of ranges) {
        if (!containsAny(message, patterns)) continue

        const matched = options
            .map((item, index) => ({
                index,
                hour: Number(formatTime(item.departureTime).slice(0, 2)),
            }))
            .filter(item => item.hour >= startHour && item.hour < endHour)
            .sort((left, right) => left.hour - right.hour)

        if (matched.length > 0) return matched[0].index
    }
}

function extractTimeText(message: string) {
    const match = message.match(/\b(\d{1,2})(?:h|gio|giờ)(?:(\d{1,2}))?\b/)
    if (!match) return undefined

    const hour = Number(match[1])
    const minute = match[2] ? Number(match[2]) : 0

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function findBestTextMatchIndex(message: string, labels: string[]) {
    const selection = getSelectionText(message)
    if (!selection) return undefined

    const scored = labels
        .map((label, index) => ({
            index,
            score: getTextMatchScore(label, selection),
        }))
        .filter(item => item.score > 0)
        .sort((left, right) => right.score - left.score)

    if (scored.length === 0) return undefined

    // Bỏ tie-breaker: luôn chọn cái có score cao nhất (nếu bằng nhau lấy cái đầu)
    // Tránh việc user nói tự nhiên mà bị re-ask liên tục vì "ambiguous"
    return scored[0].index
}

function getTextMatchScore(label: string, selection: string) {
    const normalizedLabel = normalizeSearch(label)

    if (normalizedLabel === selection) return 100
    if (normalizedLabel.includes(selection)) return 80 + selection.length / 100
    if (selection.includes(normalizedLabel)) return 70 + normalizedLabel.length / 100

    const tokens = getMeaningfulTokens(selection)
    if (tokens.length === 0) return 0

    const matchedTokens = tokens.filter(token => normalizedLabel.includes(token))

    if (tokens.length >= 2 && matchedTokens.length === tokens.length) {
        return 60 + matchedTokens.join('').length / 100
    }

    if (tokens.length === 1 && tokens[0].length >= 4 && matchedTokens.length === 1) {
        return 40 + tokens[0].length / 100
    }

    return 0
}

function getSelectionText(message: string) {
    return normalizeSearch(message)
        .replace(
            /\b(?:toi|tui|minh|em|anh|chi|cho|giup|muon|can|lay|chon|lua|lua chon|cai|nay|do|diem|diem don|diem tra|don|tra|xuong|o|tai|nha xe|chuyen|ghe|so|muc|option|ve|di)\b/g,
            ' '
        )
        .replace(/\s+/g, ' ')
        .trim()
}

function getMeaningfulTokens(value: string) {
    const stopWords = new Set([
        'toi',
        'tui',
        'minh',
        'em',
        'anh',
        'chi',
        'cho',
        'giup',
        'muon',
        'can',
        'chon',
        'lay',
        'cai',
        'nay',
        'do',
        'diem',
        'don',
        'tra',
        'xuong',
        'nha',
        'xe',
        'chuyen',
        'ghe',
        'so',
        'muc',
        'option',
        'di',
        've',
        'o',
        'tai',
    ])

    return normalizeSearch(value)
        .split(' ')
        .filter(token => token.length > 1 && !stopWords.has(token))
}

function formatScheduleOptions(options: AiChatScheduleOption[]) {
    return options
        .map(
            (item, index) =>
                `${index + 1}. ${item.name} - ${formatTime(item.departureTime)} - ${item.fromLocation} -> ${item.toLocation}${item.totalStars ? ` - ${item.totalStars} sao` : ''}`
        )
        .join('\n')
}

function formatStopOptions(options: AiChatStopOption[]) {
    return options
        .map((item, index) => {
            const price = item.price !== undefined ? ` - ${formatMoney(item.price)}` : ''
            return `${index + 1}. ${formatStopLabel(item)}${price}`
        })
        .join('\n')
}

function formatStopLabel(item: AiChatStopOption) {
    return `${item.address}, ${item.city}`
}

function formatSeatOptions(options: AiChatSeatOption[]) {
    const floorOne = options.filter(item => item.type === 1)
    const floorTwo = options.filter(item => item.type === 2)
    const lines = [`Tổng còn ${options.length} ghế.`]

    if (floorOne.length > 0) {
        lines.push(formatSeatFloor('Tầng 1', floorOne))
    }

    if (floorTwo.length > 0) {
        lines.push(formatSeatFloor('Tầng 2', floorTwo))
    }

    return lines.join('\n')
}

function formatSeatFloor(label: string, seats: AiChatSeatOption[]) {
    return chunkItems(seats.map(formatSeatChoice), SEAT_OPTIONS_PER_LINE)
        .map((line, index) => (index === 0 ? `${label}: ${line}` : `        ${line}`))
        .join('\n')
}

function formatSeatChoice(item: AiChatSeatOption) {
    return item.seatNumber
}

function chunkItems(items: string[], size: number) {
    const chunks: string[] = []

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size).join(', '))
    }

    return chunks
}

function formatTime(value: string) {
    return value.slice(0, 5)
}

function formatDisplayDate(value: Date | string) {
    return utils.time.formatCalendarDate(new Date(value), 'DD/MM/YYYY')
}

function formatMoney(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

async function buildCustomerAssistantContext(params: {
    userInfo: UserInfo
    message: string
    state?: AiChatState
}) {
    const blocks: ContextBlock[] = []
    const normalizedMessage = normalize(params.message)
    const numeric = {
        ...extractNumericEntities(params.message),
        ...extractStateEntities(params.state),
    }
    const tripSearch = extractTripSearchParams(params.message)

    blocks.push({
        title: 'Nguoi dung hien tai',
        content: [`role=${params.userInfo.role}`, `status=${params.userInfo.status}`].join('\n'),
    })

    blocks.push({
        title: 'Y dinh va rang buoc an toan',
        content: buildIntentSummary(normalizedMessage),
    })

    blocks.push({
        title: 'Quy tac giao tiep voi khach',
        content:
            'Khong hien ID noi bo va khong yeu cau khach nhap ID. Neu can khach chon, hay dung so thu tu hien thi, nha xe, gio khoi hanh, dia chi diem don/tra hoac so ghe.',
    })

    if (isTicketCancellationMessage(normalizedMessage)) {
        blocks.push({
            title: 'Chinh sach huy ve',
            content: TICKET_CANCELLATION_POLICY_CONTEXT,
        })
    }

    if (shouldFetchTripSchedules(normalizedMessage, tripSearch)) {
        blocks.push(
            await safeContext('Lich trinh phu hop', () => getTripScheduleContext(tripSearch))
        )
    }

    if (numeric.scheduleId && shouldFetchPickupStops(normalizedMessage)) {
        blocks.push(
            await safeContext('Diem don cua lich trinh', () =>
                getPickupContext(numeric.scheduleId ?? 0)
            )
        )
    } else if (shouldFetchPickupStops(normalizedMessage)) {
        blocks.push({
            title: 'Can chon lich trinh truoc khi lay diem don',
            content:
                'Hay noi khach chon mot chuyen theo so thu tu, nha xe hoac gio khoi hanh trong danh sach lich trinh truoc; khong yeu cau nhap scheduleId.',
        })
    }

    if (numeric.scheduleId && numeric.fromStationId && numeric.stopOrder) {
        blocks.push(
            await safeContext('Diem tra sau diem don', () =>
                getDropoffContext({
                    scheduleId: numeric.scheduleId ?? 0,
                    fromStationId: numeric.fromStationId ?? 0,
                    stopOrder: numeric.stopOrder ?? 0,
                })
            )
        )
    } else if (containsAny(normalizedMessage, ['diem tra', 'điểm trả', 'dropoff', 'tra o dau'])) {
        blocks.push({
            title: 'Can chon diem don truoc khi lay diem tra',
            content:
                'Hay noi khach chon diem don trong danh sach truoc; khong yeu cau nhap stationId hay stopOrder.',
        })
    }

    if (numeric.tripId && numeric.stopOrderPickup && numeric.stopOrderDropoff) {
        blocks.push(
            await safeContext('Ghe con trong', () =>
                getSeatContext({
                    tripId: numeric.tripId ?? 0,
                    stopOrderPickup: numeric.stopOrderPickup ?? 0,
                    stopOrderDropoff: numeric.stopOrderDropoff ?? 0,
                })
            )
        )
    } else if (containsAny(normalizedMessage, ['ghe', 'ghế', 'seat', 'cho ngoi', 'chỗ ngồi'])) {
        blocks.push({
            title: 'Can chon chang truoc khi lay ghe',
            content:
                'Hay noi khach chon chuyen, diem don va diem tra truoc; khong yeu cau nhap tripId hay stopOrder.',
        })
    }

    if (shouldFetchCoupon(normalizedMessage)) {
        blocks.push(
            await safeContext('Ma giam gia', () => getCouponContext(params.message, numeric))
        )
    }

    if (shouldFetchTicket(normalizedMessage)) {
        blocks.push(
            await safeContext('Ve cua khach hang', () =>
                getTicketContext({
                    userInfo: params.userInfo,
                    ticketId: numeric.ticketId,
                })
            )
        )
    }

    return formatContext(blocks)
}

function normalize(value: string) {
    return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeSearch(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function buildIntentSummary(message: string) {
    const intents: string[] = []

    if (containsAny(message, ['dat ve', 'đặt vé', 'book', 'booking'])) {
        intents.push(
            'Khach co the dang muon dat ve. Chi huong dan va hoi thong tin thieu; khong tu tao booking.'
        )
    }

    if (isTicketCancellationMessage(message)) {
        intents.push(
            'Khach co the dang muon huy ve. Tro ly AI khong ho tro huy ve truc tiep. Tra loi tu nhien rang khach can lien he ho tro vien cua nha xe/cong ty van hanh ve do de duoc kiem tra va huy giup. Neu noi chinh sach thi neu ro: ve VNPay/the chi huy truoc khoi hanh it nhat 24 gio; ve tien mat khong can du 24 gio; ve khu hoi huy ca chieu di va chieu ve; chuyen dang chay hoac da hoan thanh khong duoc huy.'
        )
    }

    if (containsAny(message, ['thanh toan', 'thanh toán', 'pay', 'vnpay', 'stripe', 'cash'])) {
        intents.push(
            'Khach hoi thanh toan. Giai thich cash/VNPay/Stripe va dieu kien round-trip khong dung cash.'
        )
    }

    if (
        containsAny(message, [
            'chuyen',
            'chuyến',
            'lich trinh',
            'lịch trình',
            'di tu',
            'đi từ',
            'den',
            'đến',
        ])
    ) {
        intents.push('Khach hoi tim chuyen. Neu thieu noi di/noi den/ngay di thi hoi tiep.')
    }

    if (intents.length === 0) {
        intents.push(
            'Hoi dap chung ve BusGo. Uu tien tra loi ngan gon va huong dan buoc tiep theo.'
        )
    }

    return intents.join('\n')
}

function shouldFetchTripSchedules(message: string, tripSearch: TripSearchParams) {
    const hasTripIntent = containsAny(message, [
        'dat ve',
        'đặt vé',
        'mua ve',
        'mua vé',
        'book ve',
        'book vé',
        'giu cho',
        'giữ chỗ',
        'dat cho',
        'đặt chỗ',
        'book',
        'booking',
        'chuyen',
        'chuyến',
        'lich trinh',
        'lịch trình',
        'lich xe',
        'lịch xe',
        'xe',
        'nha xe',
        'nhà xe',
        'co xe',
        'có xe',
        'tim xe',
        'tìm xe',
        'kiem xe',
        'kiếm xe',
        'di ',
        'đi ',
        'di tu',
        'đi từ',
        'den',
        'đến',
    ])

    return hasTripIntent && Boolean(tripSearch.from || tripSearch.to || tripSearch.date)
}

function shouldFetchPickupStops(message: string) {
    return containsAny(message, [
        'diem don',
        'điểm đón',
        'pickup',
        'don o dau',
        'đón ở đâu',
        'len xe o dau',
        'lên xe ở đâu',
        'diem len',
        'điểm lên',
        'ben len',
        'bến lên',
        'tram don',
        'trạm đón',
        'noi don',
        'nơi đón',
    ])
}

function shouldFetchCoupon(message: string) {
    return containsAny(message, [
        'coupon',
        'voucher',
        'ma giam',
        'mã giảm',
        'khuyen mai',
        'khuyến mãi',
        'uu dai',
        'ưu đãi',
        'giam gia',
        'giảm giá',
        'promo',
        'promotion',
        'sale',
    ])
}

function shouldFetchTicket(message: string) {
    return containsAny(message, [
        've',
        'vé',
        'ticket',
        'booking',
        'don dat',
        'đơn đặt',
        've cua toi',
        'vé của tôi',
        've da dat',
        'vé đã đặt',
        've dang giu',
        'vé đang giữ',
        'lich su ve',
        'lịch sử vé',
        'chuyen sap di',
        'chuyến sắp đi',
    ])
}

function isTicketCancellationMessage(message: string) {
    return containsAny(message, ['huy ve', 'huỷ vé', 'hủy vé', 'cancel'])
}

function containsAny(value: string, patterns: string[]) {
    const normalizedValue = normalizeSearch(value)
    return patterns.some(pattern => normalizedValue.includes(normalizeSearch(pattern)))
}

function containsAnyWord(value: string, patterns: string[]) {
    const normalizedValue = normalizeSearch(value)

    return patterns.some(pattern => {
        const normalizedPattern = escapeRegExp(normalizeSearch(pattern))
        return new RegExp(`(^|\\s)${normalizedPattern}(?=\\s|$)`).test(normalizedValue)
    })
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractTripSearchParams(message: string): TripSearchParams {
    const normalized = message.replace(/\s+/g, ' ').trim()
    const withoutIntent = stripTripSearchNoise(normalized)
        .replace(
            /^(?:tôi\s+muốn|toi\s+muon|mình\s+muốn|minh\s+muon|muốn|muon|cho\s+tôi|cho\s+toi|cho\s+mình|cho\s+minh|đặt\s+vé|dat\s+ve|book)\s+/iu,
            ''
        )
        .replace(/^(?:đặt\s+vé|dat\s+ve|mua\s+vé|mua\s+ve|book\s+vé|book\s+ve|book)\s+/iu, '')
        .trim()

    const reverseRouteMatch = withoutIntent.match(
        /(?:đi|di)\s+(.+?)\s+(?:từ|tu)\s+(.+?)(?:\s+(?:ngày|ngay|hôm|hom|lúc|luc)|[,.]|$)/iu
    )
    const routeMatch =
        withoutIntent.match(
            /(?:đi\s+)?(?:từ|tu)\s+(.+?)\s+(?:đến|den|tới|toi)\s+(.+?)(?:\s+(?:ngày|ngay|hôm|hom|lúc|luc)|[,.]|$)/iu
        ) ??
        withoutIntent.match(
            /(.+?)\s+(?:đi|di)\s+(.+?)(?:\s+(?:ngày|ngay|hôm|hom|lúc|luc)|[,.]|$)/iu
        ) ??
        withoutIntent.match(
            /(.+?)\s+(?:đến|den|tới|toi)\s+(.+?)(?:\s+(?:ngày|ngay|hôm|hom|lúc|luc)|[,.]|$)/iu
        ) ??
        withoutIntent.match(
            /(.+?)\s*(?:->|=>| to )\s*(.+?)(?:\s+(?:ngày|ngay|hôm|hom|lúc|luc)|[,.]|$)/iu
        )

    return {
        from: cleanupLocation(reverseRouteMatch?.[2] ?? routeMatch?.[1]),
        to: cleanupLocation(reverseRouteMatch?.[1] ?? routeMatch?.[2]),
        date: extractDate(message),
    }
}

function stripTripSearchNoise(value: string) {
    return value
        .replace(/^(?:mai|mốt|mot|kia)\s+(?=(?:đi|di|từ|tu)\b)/iu, '')
        .replace(/\s+(?:mai|mốt|mot|kia)$/iu, '')
        .replace(
            /\b(?:hôm nay|hom nay|bữa nay|bua nay|ngày mai|ngay mai|ngày mốt|ngay mot|ngày kia|ngay kia|tuần sau|tuan sau|cuối tuần|cuoi tuan)\b/giu,
            ' '
        )
        .replace(
            /\b(?:sáng|sang|trưa|trua|chiều|chieu|tối|toi|đêm|dem|khuya)\s+(?:nay|mai|mốt|mot|kia)\b/giu,
            ' '
        )
        .replace(/\b(?:lúc|luc)?\s*\d{1,2}\s*(?:h|giờ|gio)(?:\d{1,2})?\b/giu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function cleanupLocation(value?: string) {
    if (!value) return undefined
    return value
        .replace(/\b(ngày|ngay|hôm nay|hom nay|ngày mai|ngay mai)\b.*$/iu, '')
        .replace(/^(?:xe|vé|ve|chuyến|chuyen|tuyến|tuyen)\s+/iu, '')
        .trim()
}

function extractDate(message: string) {
    const normalized = normalize(message)

    if (containsAny(normalized, ['hom nay', 'hôm nay', 'bua nay', 'bữa nay', 'today'])) {
        return utils.time.getRelativeAppCalendarDate(0)
    }

    if (
        containsAny(normalized, [
            'ngay mai',
            'ngày mai',
            'sang mai',
            'sáng mai',
            'chieu mai',
            'chiều mai',
            'toi mai',
            'tối mai',
            'dem mai',
            'đêm mai',
            'tomorrow',
        ]) ||
        normalizeSearch(message).match(/\b(?:di|dat|book|ve|chuyen|xe)\b.*\bmai\b/)
    ) {
        return utils.time.getRelativeAppCalendarDate(1)
    }

    if (containsAny(normalized, ['ngay mot', 'ngày mốt', 'ngay kia', 'ngày kia'])) {
        return utils.time.getRelativeAppCalendarDate(2)
    }

    const weekdayDate = extractWeekdayDate(message)
    if (weekdayDate) {
        return weekdayDate
    }

    if (containsAny(normalized, ['cuoi tuan', 'cuối tuần', 'weekend'])) {
        return getNextWeekdayDate(6, false)
    }

    if (containsAny(normalized, ['tuan sau', 'tuần sau', 'next week'])) {
        return utils.time.getRelativeAppCalendarDate(7)
    }

    const vietnameseDateMatch = normalizeSearch(message).match(
        /\b(?:ngay\s*)?(\d{1,2})\s*(?:thang|t)\s*(\d{1,2})(?:\s*(?:nam|n)\s*(\d{2,4}))?\b/
    )
    if (vietnameseDateMatch) {
        const year = vietnameseDateMatch[3]
            ? Number(
                  vietnameseDateMatch[3].length === 2
                      ? `20${vietnameseDateMatch[3]}`
                      : vietnameseDateMatch[3]
              )
            : utils.time.getNow().year()

        return utils.time.getAppCalendarDate({
            year,
            month: Number(vietnameseDateMatch[2]),
            day: Number(vietnameseDateMatch[1]),
        })
    }

    const isoMatch = message.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
    if (isoMatch) {
        return utils.time.getAppCalendarDate({
            year: Number(isoMatch[1]),
            month: Number(isoMatch[2]),
            day: Number(isoMatch[3]),
        })
    }

    const slashMatch = message.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
    if (slashMatch) {
        const year = slashMatch[3]
            ? Number(slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3])
            : utils.time.getNow().year()
        return utils.time.getAppCalendarDate({
            year,
            month: Number(slashMatch[2]),
            day: Number(slashMatch[1]),
        })
    }

    return undefined
}

function extractWeekdayDate(message: string) {
    const normalizedMessage = normalizeSearch(message)
    const weekdayMatch =
        normalizedMessage.match(/\b(?:thu|thứ)\s*([2-7])\b/) ??
        normalizedMessage.match(/\bt([2-7])\b/)

    if (weekdayMatch) {
        return getNextWeekdayDate(
            Number(weekdayMatch[1]) - 1,
            containsAny(message, ['tuan sau', 'tuần sau'])
        )
    }

    if (containsAny(message, ['chu nhat', 'chủ nhật', 'cn', 'sunday'])) {
        return getNextWeekdayDate(0, containsAny(message, ['tuan sau', 'tuần sau']))
    }
}

function getNextWeekdayDate(targetDay: number, forceNextWeek: boolean) {
    const now = utils.time.getNow()

    if (forceNextWeek) {
        const daysUntilNextMonday = (1 - now.day() + 7) % 7 || 7
        const daysFromMonday = targetDay === 0 ? 6 : targetDay - 1
        return utils.time.getRelativeAppCalendarDate(daysUntilNextMonday + daysFromMonday)
    }

    const daysAhead = (targetDay - now.day() + 7) % 7 || 7
    return utils.time.getRelativeAppCalendarDate(daysAhead)
}

function extractNumericEntities(message: string): NumericEntities {
    return {
        bookingId: extractNumber(message, ['bookingId']),
        companyId: extractNumber(message, ['companyId']),
        couponId: extractNumber(message, ['couponId', 'coupon id']),
        fromStationId: extractNumber(message, ['fromStationId']),
        orderTotal: extractAmount(message),
        scheduleId: extractNumber(message, ['scheduleId']),
        stationId: extractNumber(message, ['stationId']),
        stopOrder: extractNumber(message, ['stopOrder']),
        stopOrderDropoff: extractNumber(message, ['stopOrderDropoff']),
        stopOrderPickup: extractNumber(message, ['stopOrderPickup']),
        ticketId: extractNumber(message, ['ticketId']),
        tripId: extractNumber(message, ['tripId']),
    }
}

function extractStateEntities(state?: AiChatState): NumericEntities {
    if (!state) return {}

    return {
        bookingId: toNumber(state.bookingId),
        companyId: toNumber(state.companyId),
        couponId: toNumber(state.couponId),
        fromStationId: toNumber(state.fromStationId),
        orderTotal: toNumber(state.orderTotal),
        scheduleId: toNumber(state.scheduleId),
        stopOrder: toNumber(state.stopOrder),
        stopOrderDropoff: toNumber(state.stopOrderDropoff),
        stopOrderPickup: toNumber(state.stopOrderPickup),
        ticketId: toNumber(state.ticketId),
        tripId: toNumber(state.tripId),
    }
}

function toNumber(value?: number) {
    return value === undefined ? undefined : Number(value)
}

function extractNumber(message: string, labels: string[]) {
    for (const label of labels) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = message.match(new RegExp(`${escaped}\\s*[:#-]?\\s*(\\d+)`, 'iu'))
        if (match) return Number(match[1])
    }

    return undefined
}

function extractAmount(message: string) {
    const match = message.match(
        /(?:orderTotal|tong tien|tổng tiền|gia tri don|giá trị đơn|don hang|đơn hàng)\s*[:#-]?\s*([\d.,]+)/iu
    )

    if (!match) return undefined

    const normalized = match[1].replace(/[.,]/g, '')
    const amount = Number(normalized)
    return Number.isFinite(amount) ? amount : undefined
}

async function safeContext(title: string, fn: () => Promise<string>): Promise<ContextBlock> {
    try {
        return {
            title,
            content: await fn(),
        }
    } catch (error) {
        return {
            title,
            content: `Khong lay duoc du lieu: ${error instanceof Error ? error.message : 'Loi khong xac dinh'}`,
        }
    }
}

async function getTripScheduleContext(search: TripSearchParams) {
    const resolvedSearch = await resolveTripSearchParams(search)
    const result = await tripSchedule.getTripSchedules({
        limit: 10,
        orderBy: 'asc',
        ...(resolvedSearch.from ? { from: resolvedSearch.from } : {}),
        ...(resolvedSearch.to ? { to: resolvedSearch.to } : {}),
        ...(resolvedSearch.date ? { date: resolvedSearch.date } : {}),
    })

    if (result.trip.length === 0) {
        return [
            'Khong tim thay lich trinh phu hop voi thong tin hien co.',
            search.from ? `noiDiNguoiDungNhap=${search.from}` : undefined,
            search.to ? `noiDenNguoiDungNhap=${search.to}` : undefined,
            resolvedSearch.from ? `noiDiDaHieu=${resolvedSearch.from}` : undefined,
            resolvedSearch.to ? `noiDenDaHieu=${resolvedSearch.to}` : undefined,
        ]
            .filter(Boolean)
            .join('\n')
    }

    return result.trip
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item, index) =>
            [
                `Lua chon ${index + 1}`,
                `nhaXe=${item.name}`,
                `tuyen=${item.fromLocation} -> ${item.toLocation}`,
                `gio=${item.departureTime}`,
                `hieuLuc=${formatContextDate(item.startDate)}-${formatContextDate(item.endDate)}`,
                `rating=${item.totalStars}`,
            ].join(', ')
        )
        .join('\n')
}

async function resolveTripSearchParams(search: TripSearchParams): Promise<TripSearchParams> {
    if (!search.from && !search.to) {
        return search
    }

    const routes = await getRouteOptions()
    const exactRoute = routes.find(item => {
        const fromMatches = search.from ? isLocationMatch(item.fromLocation, search.from) : true
        const toMatches = search.to ? isLocationMatch(item.toLocation, search.to) : true
        return fromMatches && toMatches
    })

    if (exactRoute) {
        return {
            date: search.date,
            from: exactRoute.fromLocation,
            to: exactRoute.toLocation,
        }
    }

    return {
        date: search.date,
        from: search.from
            ? resolveLocationName(
                  search.from,
                  routes.flatMap(item => [item.fromLocation, item.toLocation])
              )
            : undefined,
        to: search.to
            ? resolveLocationName(
                  search.to,
                  routes.flatMap(item => [item.fromLocation, item.toLocation])
              )
            : undefined,
    }
}

async function getRouteOptions() {
    const result = await route.getRoutes({ limit: 100 })
    return result.routes
}

function resolveLocationName(input: string, candidates: string[]) {
    return candidates.find(candidate => isLocationMatch(candidate, input)) ?? input
}

function isLocationMatch(candidate: string, input: string) {
    const normalizedCandidate = normalizeSearch(candidate)
    const normalizedInput = normalizeSearch(input)

    return (
        normalizedCandidate === normalizedInput ||
        normalizedCandidate.includes(normalizedInput) ||
        normalizedInput.includes(normalizedCandidate)
    )
}

function formatContextDate(value: Date | string) {
    return utils.time.formatCalendarDate(new Date(value))
}

async function getPickupContext(scheduleId: number) {
    const result = await tripSchedule.getPickupStops(OperationTripScheduleId.parse(scheduleId))

    if (result.tripStops.length === 0) {
        return 'Lich trinh nay chua co diem don.'
    }

    return result.tripStops
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item, index) =>
            [`Lua chon ${index + 1}`, `diaChi=${item.address}`, `city=${item.city}`].join(', ')
        )
        .join('\n')
}

async function getDropoffContext(params: {
    fromStationId: number
    scheduleId: number
    stopOrder: number
}) {
    const result = await tripSchedule.getDropoffStops(
        OperationTripScheduleId.parse(params.scheduleId),
        OperationStationId.parse(params.fromStationId),
        params.stopOrder
    )

    if (result.tripStops.length === 0) {
        return 'Khong co diem tra phu hop sau diem don da chon.'
    }

    return result.tripStops
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item, index) =>
            [
                `Lua chon ${index + 1}`,
                `diaChi=${item.address}`,
                `city=${item.city}`,
                `price=${item.price}`,
            ].join(', ')
        )
        .join('\n')
}

async function getSeatContext(params: {
    stopOrderDropoff: number
    stopOrderPickup: number
    tripId: number
}) {
    const result = await seat.getSeats({
        id: OperationTripId.parse(params.tripId),
        stopOrderPickup: params.stopOrderPickup,
        stopOrderDropoff: params.stopOrderDropoff,
    })

    if (result.seats.length === 0) {
        return 'Khong con ghe trong cho chang da chon.'
    }

    return result.seats
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item, index) => `Lua chon ${index + 1}: ghe=${item.seatNumber}, loai=${item.type}`)
        .join('\n')
}

async function getCouponContext(message: string, numeric: NumericEntities) {
    const code = extractCouponCode(message)

    if (numeric.orderTotal && (code || numeric.couponId || numeric.companyId)) {
        const result = await coupon.getCouponByCode({
            orderTotal: numeric.orderTotal,
            ...(code ? { code } : {}),
            ...(numeric.couponId ? { id: BookingCouponId.parse(numeric.couponId) } : {}),
            ...(numeric.companyId
                ? { companyId: OrganizationBusCompanyId.parse(numeric.companyId) }
                : {}),
        })

        return `Ma giam gia hop le: giam=${result.discountAmount}, tongSauGiam=${result.finalTotal}`
    }

    if (numeric.orderTotal) {
        const result = await coupon.getCoupons({
            orderTotal: numeric.orderTotal,
            ...(numeric.companyId
                ? { companyId: OrganizationBusCompanyId.parse(numeric.companyId) }
                : {}),
        })

        if (result.coupons.length === 0) {
            return 'Khong co coupon phu hop voi tong tien hien tai.'
        }

        return result.coupons
            .slice(0, MAX_CONTEXT_ITEMS)
            .map((item, index) =>
                [
                    `Lua chon ${index + 1}`,
                    `code=${item.code}`,
                    `type=${item.discountType}`,
                    `value=${item.discountValue}`,
                    `minOrder=${item.minOrderAmount}`,
                    `maxDiscount=${item.maxDiscountAmount}`,
                ].join(', ')
            )
            .join('\n')
    }

    return 'Can tong tien don hang va ma giam gia neu khach muon kiem tra mot ma cu the.'
}

function extractCouponCode(message: string) {
    const match = message.match(/(?:coupon|voucher|ma|mã|code)\s*[:#-]?\s*([A-Z0-9_-]{3,})/iu)
    if (match?.[1]) return match[1].toUpperCase()

    const bareCodeMatch = message.trim().match(/^[A-Z0-9_-]{3,}$/iu)
    return bareCodeMatch?.[0]?.toUpperCase()
}

async function getTicketContext(params: { ticketId?: number; userInfo: UserInfo }) {
    if (params.ticketId) {
        const result = await ticket.detailTicket(
            BookingTicketId.parse(params.ticketId),
            params.userInfo.id
        )

        return [
            `code=${result.ticket.code}`,
            `status=${result.ticket.status}`,
            `bookingType=${result.ticket.bookingType}`,
            `amount=${result.ticket.totalAmount}`,
            `seat=${result.ticket.seatNumber}`,
            `vehicle=${result.ticket.plateNumber}`,
            `route=${result.ticket.fromLocation} -> ${result.ticket.toLocation}`,
            `departure=${result.ticket.departureDate?.toISOString() ?? 'null'} ${result.ticket.departureTime ?? ''}`,
        ].join(', ')
    }

    const result = await ticket.getTickets({ limit: 10 }, params.userInfo.id)

    if (result.tickets.length === 0) {
        return 'Khach hang chua co ve nao.'
    }

    return result.tickets
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item, index) =>
            [
                `Ve ${index + 1}`,
                `status=${item.status}`,
                `bookingType=${item.bookingType}`,
                `amount=${item.totalAmount}`,
                `tripStatus=${item.tripStatus}`,
                `departure=${item.departureDate?.toISOString() ?? 'null'}`,
                `expiredAt=${utils.time.getNext({ milliseconds: utils.time.coolDownTime }) ?? 'null'}`,
            ].join(', ')
        )
        .join('\n')
}

function formatContext(blocks: ContextBlock[]) {
    return blocks
        .filter(block => block.content.trim().length > 0)
        .map(block => `## ${block.title}\n${block.content}`)
        .join('\n\n')
}
