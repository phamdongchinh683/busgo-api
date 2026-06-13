import { BookingCouponId } from '../../database/booking/coupon/type.js'
import { BookingType } from '../../database/booking/booking/type.js'
import { OperationStationId } from '../../database/operation/station/type.js'
import { OperationTripId } from '../../database/operation/trip/type.js'
import { OrganizationSeatId } from '../../database/organization/seat/type.js'
import { dal } from '../../database/index.js'
import type {
    AiChatResponse,
    AiChatScheduleOption,
    AiChatSeatOption,
    AiChatState,
    AiChatStopOption,
} from '../../model/body/chat/index.js'
import type { UserInfo } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'
import * as booking from '../booking/booking.js'
import * as tripSchedule from '../operation/trip-schedule.js'
import * as operationTrip from '../operation/trip.js'
import * as seat from '../organization/seat.js'
import { resolveLatestVietnamLocationName } from './location.js'

const MAX_FLOW_OPTIONS = 5
const MAX_SEAT_OPTIONS = 36
const SEAT_OPTIONS_PER_LINE = 12

type PreferredTime = 'afternoon' | 'evening' | 'morning' | 'night'

export type TripSearchParams = {
    date?: Date
    from?: string
    preferredTime?: PreferredTime
    to?: string
}

export async function searchSchedules(params: {
    args: Record<string, unknown>
    message: string
    state?: AiChatState
}): Promise<AiChatResponse> {
    const state = params.state ?? { stage: 'idle' as const }
    const messageSearch = extractTripSearchParams(params.message)
    const from = getStringArg(params.args, 'from') ?? messageSearch.from ?? state.from
    const to = getStringArg(params.args, 'to') ?? messageSearch.to ?? state.to
    const search: TripSearchParams = {
        from,
        to,
        date: getDateArg(params.args, 'departureDate') ?? messageSearch.date ?? state.departureDate,
        preferredTime:
            getPreferredTimeArg(params.args, 'preferredTime') ??
            extractPreferredTime(params.message),
    }

    return safeBookingFlow(state, () => listSchedules(search))
}

export async function listPickupStops(params: {
    message: string
    state?: AiChatState
}): Promise<AiChatResponse> {
    const state = params.state ?? { stage: 'idle' as const }

    if (state.scheduleOptions?.length) {
        const selectedIndex = matchScheduleOption(params.message, state.scheduleOptions)
        if (selectedIndex === undefined) {
            return {
                message: `Bạn chọn chuyến nào?\n${formatScheduleOptions(state.scheduleOptions)}`,
                state,
            }
        }

        return safeBookingFlow(state, () =>
            selectSchedule({
                message: params.message,
                selectedIndex,
                state,
            })
        )
    }

    if (state.selectedSchedule || state.scheduleId) {
        return safeBookingFlow(state, () => getPickupStops(state))
    }

    return {
        message: 'Bạn chọn chuyến trước nhé.',
        state,
    }
}

export async function listDropoffStops(params: {
    message: string
    state?: AiChatState
}): Promise<AiChatResponse> {
    const state = params.state ?? { stage: 'idle' as const }

    if (state.pickupOptions?.length) {
        const selectedIndex = matchStopOption(params.message, state.pickupOptions)
        if (selectedIndex === undefined) {
            return {
                message: `Bạn chọn điểm đón nào?\n${formatStopOptions(state.pickupOptions)}`,
                state,
            }
        }

        return safeBookingFlow(state, () => selectPickup({ selectedIndex, state }))
    }

    if (state.selectedPickup || hasDropoffLookupState(state)) {
        return safeBookingFlow(state, () => getDropoffStops(state))
    }

    return {
        message: 'Bạn chọn điểm đón trước nhé.',
        state,
    }
}

export async function checkAvailableSeats(params: {
    message: string
    state?: AiChatState
}): Promise<AiChatResponse> {
    const state = params.state ?? { stage: 'idle' as const }

    if (state.dropoffOptions?.length) {
        const selectedIndex = matchStopOption(params.message, state.dropoffOptions)
        if (selectedIndex === undefined) {
            return {
                message: `Bạn chọn điểm trả nào?\n${formatStopOptions(state.dropoffOptions)}`,
                state,
            }
        }

        return safeBookingFlow(state, () => selectDropoff({ selectedIndex, state }))
    }

    if (state.selectedDropoff || hasSeatLookupState(state)) {
        return safeBookingFlow(state, () => listSeats(state))
    }

    return {
        message: 'Bạn chọn điểm trả trước nhé.',
        state,
    }
}

export async function createHoldBooking(params: {
    message: string
    state?: AiChatState
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    const state = params.state ?? { stage: 'idle' as const }

    if (state.stage === 'booking_created' && state.bookingId) {
        return {
            message:
                'Đã giữ chỗ thành công cho bạn. Bạn vào Profile > Vé > Đã giữ chỗ để thanh toán trước khi vé hết hạn nhé.',
            state,
        }
    }

    let selectedSeat = state.selectedSeat
    if (!selectedSeat && state.seatOptions?.length) {
        const selectedIndex = matchSeatOption(params.message, state.seatOptions)
        if (selectedIndex === undefined) {
            return {
                message: `Bạn chọn ghế nào?\n${formatSeatOptions(state.seatOptions)}`,
                state,
            }
        }
        selectedSeat = state.seatOptions[selectedIndex]
    }

    if (!selectedSeat) {
        return {
            message: 'Bạn chọn ghế trước nhé.',
            state,
        }
    }

    const result = await safeBookingFlow(state, () =>
        createBookingFromState({
            state: {
                ...state,
                selectedSeat,
                orderTotal: state.selectedDropoff?.price ?? state.orderTotal,
            },
            userInfo: params.userInfo,
        })
    )

    if (result.state?.stage === 'booking_created' && result.state.bookingId) {
        return {
            message:
                'Đã giữ chỗ thành công cho bạn. Bạn vào Profile > Vé > Đã giữ chỗ để thanh toán trước khi vé hết hạn nhé.',
            state: result.state,
        }
    }

    return result
}

async function safeBookingFlow(
    state: AiChatState,
    fn: () => Promise<AiChatResponse>
): Promise<AiChatResponse> {
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

async function listSchedules(search: TripSearchParams): Promise<AiChatResponse> {
    if (!search.from || !search.to) {
        return {
            message: 'Bạn muốn đi từ đâu đến đâu?',
            state: {
                stage: 'idle',
                from: search.from,
                to: search.to,
                departureDate: search.date,
            },
        }
    }

    if (!search.date) {
        return {
            message: 'Bạn muốn đi ngày nào?',
            state: {
                stage: 'idle',
                from: search.from,
                to: search.to,
            },
        }
    }

    const resolvedSearch = await resolveTripSearchParams(search)
    const result = await tripSchedule.getTripSchedules({
        limit: 10,
        orderBy: 'asc',
        from: resolvedSearch.from,
        to: resolvedSearch.to,
        date: resolvedSearch.date,
    })
    const scheduleOptions = result.trip
        .filter(
            item =>
                !search.preferredTime ||
                isTimeInPreferredRange(item.departureTime, search.preferredTime)
        )
        .slice(0, MAX_FLOW_OPTIONS)
        .map(item => ({
            scheduleId: item.internalId,
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
            message: `Mình chưa tìm thấy chuyến ${state.from} -> ${state.to} ngày ${formatDisplayDate(search.date)}. Bạn thử đổi ngày hoặc tuyến khác nhé.`,
            state,
        }
    }

    return {
        message: [
            `Mình tìm thấy ${scheduleOptions.length} chuyến cho tuyến ${state.from} -> ${state.to} ngày ${formatDisplayDate(search.date)}:`,
            formatScheduleOptions(scheduleOptions),
            'Bạn chọn chuyến nào?',
        ].join('\n'),
        state,
    }
}

async function selectSchedule(params: {
    message: string
    selectedIndex: number
    state: AiChatState
}): Promise<AiChatResponse> {
    const selectedSchedule = params.state.scheduleOptions?.[params.selectedIndex]
    if (!selectedSchedule) {
        return {
            message: 'Mình không thấy lựa chọn đó, bạn chọn lại theo danh sách nhé.',
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
        scheduleOptions: undefined,
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
        return {
            message: 'Chuyến này đã quá giờ khởi hành. Bạn chọn chuyến khác nhé.',
            state: {
                ...params.state,
                selectedSchedule: undefined,
                scheduleId: undefined,
            },
        }
    }

    return getPickupStops(state)
}

async function getPickupStops(state: AiChatState): Promise<AiChatResponse> {
    const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId
    if (!scheduleId) {
        return {
            message: 'Bạn chọn chuyến trước nhé.',
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
                if (dropoffResult.tripStops.length === 0) return undefined

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
        scheduleOptions: undefined,
    }

    if (pickupOptions.length === 0) {
        return {
            message: 'Chuyến này hiện chưa có điểm đón phù hợp để đặt vé.',
            state: nextState,
        }
    }

    if (pickupOptions.length === 1) {
        const selectedPickup = pickupOptions[0]
        const response = await selectPickup({
            selectedIndex: 0,
            state: nextState,
        })

        return {
            ...response,
            message: [
                `Chuyến chỉ có một điểm đón tại ${selectedPickup.address}, ${selectedPickup.city} nên mình đã chọn giúp bạn.`,
                response.message,
            ].join('\n'),
        }
    }

    return {
        message: [
            `Điểm đón hiện có:\n${formatStopOptions(pickupOptions)}`,
            'Bạn muốn đón ở đâu?',
        ].join('\n'),
        state: nextState,
    }
}

async function selectPickup(params: {
    selectedIndex: number
    state: AiChatState
}): Promise<AiChatResponse> {
    const selectedPickup = params.state.pickupOptions?.[params.selectedIndex]
    const scheduleId = params.state.selectedSchedule?.scheduleId ?? params.state.scheduleId
    if (!selectedPickup || !scheduleId) {
        return {
            message: 'Mình không thấy điểm đón đó, bạn chọn lại theo danh sách nhé.',
            state: params.state,
        }
    }

    return getDropoffStops({
        ...params.state,
        stage: 'dropoff_listed',
        scheduleId,
        selectedPickup,
        fromStationId: selectedPickup.stationId,
        stopOrder: selectedPickup.stopOrder,
        stopOrderPickup: selectedPickup.stopOrder,
    })
}

async function getDropoffStops(state: AiChatState): Promise<AiChatResponse> {
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
        pickupOptions: undefined,
        scheduleOptions: undefined,
    }

    if (dropoffOptions.length === 0) {
        return {
            message: 'Điểm đón này chưa có điểm trả phù hợp, bạn chọn điểm đón khác nhé.',
            state: nextState,
        }
    }

    return {
        message: [
            `Điểm trả phù hợp:\n${formatStopOptions(dropoffOptions)}`,
            'Bạn muốn trả ở đâu?',
        ].join('\n'),
        state: nextState,
    }
}

async function selectDropoff(params: {
    selectedIndex: number
    state: AiChatState
}): Promise<AiChatResponse> {
    const selectedDropoff = params.state.dropoffOptions?.[params.selectedIndex]
    if (!selectedDropoff) {
        return {
            message: 'Mình không thấy điểm trả đó, bạn chọn lại theo danh sách nhé.',
            state: params.state,
        }
    }

    return listSeats({
        ...params.state,
        stage: 'seat_listed',
        selectedDropoff,
        stopOrderDropoff: selectedDropoff.stopOrder,
        dropoffOptions: undefined,
        pickupOptions: undefined,
        seatOptions: undefined,
        selectedSeat: undefined,
    })
}

async function listSeats(state: AiChatState): Promise<AiChatResponse> {
    const stopOrderPickup = state.selectedPickup?.stopOrder ?? state.stopOrderPickup
    const stopOrderDropoff = state.selectedDropoff?.stopOrder ?? state.stopOrderDropoff
    if (stopOrderPickup === undefined || stopOrderDropoff === undefined) {
        return {
            message: 'Bạn chọn điểm đón và điểm trả trước nhé.',
            state,
        }
    }

    let tripId = state.tripId
    const companyId = state.companyId ?? state.selectedSchedule?.companyId

    if (!tripId) {
        const scheduleId = state.selectedSchedule?.scheduleId ?? state.scheduleId
        if (!scheduleId || !companyId || !state.departureDate) {
            return {
                message: 'Bạn chọn chuyến và ngày đi trước để mình kiểm tra ghế trống nhé.',
                state,
            }
        }

        const internalCompanyId = companyId
        const preparedTrip = await operationTrip.prepareTrip({
            scheduleId,
            companyId: internalCompanyId,
            departureDate: state.departureDate,
        })
        tripId = preparedTrip.id
    }

    if (!tripId) {
        throw new Error('Failed to prepare trip')
    }

    const result = await seat.getSeatsByTripId(tripId, stopOrderPickup, stopOrderDropoff)
    const seatOptions = result.seats
        .filter(item => item.isAvailable)
        .slice(0, MAX_SEAT_OPTIONS)
        .map(item => ({
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
            message: 'Chặng này hiện chưa còn ghế trống, bạn thử chọn chuyến khác nhé.',
            state: nextState,
        }
    }

    return {
        message: [
            `Ghế còn trống:\n${formatSeatOptions(seatOptions)}`,
            'Bạn muốn giữ ghế nào?',
        ].join('\n'),
        state: nextState,
    }
}

async function createBookingFromState(params: {
    state: AiChatState
    userInfo: UserInfo
}): Promise<AiChatResponse> {
    const selectedSeat = params.state.selectedSeat
    if (
        !selectedSeat ||
        !params.state.tripId ||
        !params.state.companyId ||
        !params.state.selectedPickup ||
        !params.state.selectedDropoff
    ) {
        return {
            message: 'Mình chưa đủ thông tin để giữ chỗ, bạn chọn lại từ đầu giúp mình.',
            state: params.state,
        }
    }

    const companyId = params.state.companyId
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
                companyId,
                toStationId: OperationStationId.parse(params.state.selectedDropoff.stationId),
            },
        },
        params.userInfo.id
    )
    if (!result?.id) {
        throw new Error('Mình chưa thể giữ chỗ lúc này, bạn thử lại giúp mình.')
    }

    return {
        message:
            'Đã giữ chỗ thành công cho bạn. Bạn vào Profile > Vé > Đã giữ chỗ để thanh toán trước khi vé hết hạn nhé.',
        state: {
            ...params.state,
            stage: 'booking_created',
            selectedSeat,
            bookingId: result.internalId,
            expiredAt: result.expiredAt ?? undefined,
            seatOptions: undefined,
        },
    }
}

function matchScheduleOption(message: string, options: AiChatScheduleOption[]) {
    const normalized = normalizeSearch(message)
    if (containsAny(normalized, ['som nhat', 'chuyen som', 'dau tien'])) {
        return findScheduleByTime(options, 'asc')
    }
    if (containsAny(normalized, ['muon nhat', 'tre nhat', 'chuyen cuoi'])) {
        return findScheduleByTime(options, 'desc')
    }

    const timeRangeIndex = findScheduleByTimeRange(options, message)
    if (timeRangeIndex !== undefined) return timeRangeIndex

    const choiceIndex = extractChoiceIndex(message, options.length)
    if (choiceIndex !== undefined) return choiceIndex

    const time = extractTimeText(normalized)
    if (time) {
        const index = options.findIndex(item => formatTime(item.departureTime) === time)
        if (index >= 0) return index
    }

    return findBestTextMatchIndex(
        message,
        options.map(item => `${item.name} ${formatTime(item.departureTime)}`)
    )
}

function matchStopOption(message: string, options: AiChatStopOption[]) {
    const choiceIndex = extractChoiceIndex(message, options.length)
    if (choiceIndex !== undefined) return choiceIndex
    return findBestTextMatchIndex(
        message,
        options.map(item => `${item.address} ${item.city}`)
    )
}

function matchSeatOption(message: string, options: AiChatSeatOption[]) {
    const normalized = normalizeSearch(message)
    const seatIndex = options.findIndex(item =>
        normalized.includes(normalizeSearch(item.seatNumber))
    )
    return seatIndex >= 0 ? seatIndex : extractChoiceIndex(message, options.length)
}

function extractChoiceIndex(message: string, totalOptions: number) {
    const normalized = normalizeSearch(message)
    const choices: Array<[string[], number]> = [
        [['dau tien', 'thu nhat', 'first'], 0],
        [['thu hai', 'second'], 1],
        [['thu ba', 'third'], 2],
        [['thu tu', 'fourth'], 3],
        [['thu nam', 'fifth'], 4],
    ]
    for (const [patterns, index] of choices) {
        if (index < totalOptions && containsAny(normalized, patterns)) return index
    }
    if (containsAny(normalized, ['cuoi cung', 'chuyen cuoi', 'diem cuoi', 'last'])) {
        return totalOptions - 1
    }

    const match =
        normalized.match(/\b(?:chon|so|muc|diem|chuyen|ghe|seat|option)\s*(\d{1,2})\b/) ??
        normalized.match(/^(\d{1,2})$/)
    if (!match) return undefined

    const index = Number(match[1]) - 1
    return index >= 0 && index < totalOptions ? index : undefined
}

function findScheduleByTime(options: AiChatScheduleOption[], order: 'asc' | 'desc') {
    const sorted = options
        .map((item, index) => ({ index, time: item.departureTime }))
        .sort((left, right) => left.time.localeCompare(right.time))
    return order === 'asc' ? sorted[0]?.index : sorted[sorted.length - 1]?.index
}

function findScheduleByTimeRange(options: AiChatScheduleOption[], message: string) {
    const preferredTime = extractPreferredTime(message)
    if (!preferredTime) return undefined

    return options
        .map((item, index) => ({
            index,
            departureTime: item.departureTime,
            hour: Number(item.departureTime.slice(0, 2)),
        }))
        .filter(item => isTimeInPreferredRange(item.departureTime, preferredTime))
        .sort((left, right) => left.hour - right.hour)[0]?.index
}

function extractTimeText(message: string) {
    const match = message.match(/\b(\d{1,2})(?:h|gio)(?:(\d{1,2}))?\b/)
    if (!match) return undefined
    const hour = Number(match[1])
    const minute = Number(match[2] ?? 0)
    if (hour > 23 || minute > 59) return undefined
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function findBestTextMatchIndex(message: string, labels: string[]) {
    const selection = normalizeSearch(message)
        .replace(
            /\b(?:toi|minh|em|anh|chi|cho|giup|muon|can|lay|chon|cai|nay|do|diem|don|tra|xuong|o|tai|nha|xe|chuyen|ghe|so|muc|option|ve|di|giu|nhe|voi)\b/g,
            ' '
        )
        .replace(/\s+/g, ' ')
        .trim()
    if (!selection) return undefined

    const selectionTokens = selection.split(' ').filter(token => token.length > 1)
    const scored = labels
        .map((label, index) => {
            const labelTokens = new Set(normalizeSearch(label).split(' '))
            const score = selectionTokens.filter(token => labelTokens.has(token)).length
            return { index, score }
        })
        .filter(item => item.score > 0)
        .sort((left, right) => right.score - left.score)
    const best = scored[0]
    if (!best || best.score === scored[1]?.score) return undefined
    if (best.score >= 2) return best.index

    return selectionTokens.length === 1 && selectionTokens[0].length >= 4 ? best.index : undefined
}

function hasDropoffLookupState(state: AiChatState) {
    return Boolean(
        (state.selectedSchedule?.scheduleId ?? state.scheduleId) &&
        (state.selectedPickup?.stationId ?? state.fromStationId) &&
        (state.selectedPickup?.stopOrder ?? state.stopOrder ?? state.stopOrderPickup) !== undefined
    )
}

function hasSeatLookupState(state: AiChatState) {
    const pickup = state.selectedPickup?.stopOrder ?? state.stopOrderPickup
    const dropoff = state.selectedDropoff?.stopOrder ?? state.stopOrderDropoff
    return (
        pickup !== undefined &&
        dropoff !== undefined &&
        Boolean(
            state.tripId ||
            ((state.selectedSchedule?.scheduleId ?? state.scheduleId) &&
                (state.companyId ?? state.selectedSchedule?.companyId) &&
                state.departureDate)
        )
    )
}

async function resolveTripSearchParams(search: TripSearchParams): Promise<TripSearchParams> {
    const provinceNames = await getLatestProvinceNames()
    return {
        ...search,
        from: search.from ? resolveLocationName(search.from, provinceNames) : undefined,
        to: search.to ? resolveLocationName(search.to, provinceNames) : undefined,
    }
}

export async function resolveSearchStateLocations(state: AiChatState): Promise<AiChatState> {
    if (!state.from && !state.to) return state

    try {
        const resolved = await resolveTripSearchParams({
            from: state.from,
            to: state.to,
        })
        return {
            ...state,
            from: resolved.from,
            to: resolved.to,
        }
    } catch {
        return state
    }
}

async function getLatestProvinceNames() {
    try {
        return await service.province.getProvinceNames()
    } catch {
        throw new Error('Mình chưa thể xác định tỉnh/thành lúc này, bạn thử lại giúp mình.')
    }
}

function resolveLocationName(input: string, provinceNames: string[]) {
    const latestName = resolveLatestVietnamLocationName(input, provinceNames)
    if (!latestName) {
        throw new Error(
            `Mình chưa xác định được tỉnh/thành "${input.trim()}". Bạn nhập lại giúp mình.`
        )
    }

    return latestName
}

export function extractTripSearchParams(message: string): TripSearchParams {
    const cleaned = message
        .replace(
            /\b(?:hôm nay|hom nay|ngày mai|ngay mai|ngày mốt|ngay mot|ngày kia|ngay kia|sáng nay|sang nay|chiều nay|chieu nay|tối nay|toi nay|đêm nay|dem nay|sáng mai|sang mai|chiều mai|chieu mai|tối mai|toi mai|đêm mai|dem mai)\b/giu,
            ' '
        )
        .replace(
            /\b(?:(?:vào|vao)\s+)?(?:(?:buổi|buoi)\s+)?(?:sáng|sang|chiều|chieu|tối|đêm|dem|khuya)\b/giu,
            ' '
        )
        .replace(
            /\b(?:(?:vào|vao)\s+)?(?:ngày|ngay)\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/giu,
            ' '
        )
        .replace(/\b20\d{2}-\d{1,2}-\d{1,2}\b/gu, ' ')
        .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/gu, ' ')
        .replace(/\b(?:lúc|luc)\s+\d{1,2}(?:(?::|h)\d{1,2})?\b/giu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const directRouteMatch = cleaned.match(/^(.+?)\s+(?:đến|den)\s+(.+?)(?:[,.?]|$)/iu)
    const match =
        cleaned.match(/(?:từ|tu)\s+(.+?)\s+(?:đến|den|tới|toi)\s+(.+?)(?:[,.?]|$)/iu) ??
        cleaned.match(/(.+?)\s+(?:đi|di)\s+(.+?)(?:[,.?]|$)/iu) ??
        (directRouteMatch && isLikelyDirectRoute(directRouteMatch) ? directRouteMatch : undefined)

    return {
        from: cleanupLocation(match?.[1]),
        to: cleanupLocation(match?.[2]),
        date: extractDate(message),
        preferredTime: extractPreferredTime(message),
    }
}

export function hasMatchingCurrentOption(message: string, state: AiChatState) {
    if (isQuestionAboutCurrentOption(message)) return false

    if (state.scheduleOptions?.length) {
        return matchScheduleOption(message, state.scheduleOptions) !== undefined
    }
    if (state.pickupOptions?.length) {
        return matchStopOption(message, state.pickupOptions) !== undefined
    }
    if (state.dropoffOptions?.length) {
        return matchStopOption(message, state.dropoffOptions) !== undefined
    }
    if (state.seatOptions?.length) {
        return matchSeatOption(message, state.seatOptions) !== undefined
    }

    return false
}

function isQuestionAboutCurrentOption(message: string) {
    const normalized = normalizeSearch(message)
    const hasExplicitSelectionIntent = containsNormalizedPhrase(normalized, [
        'chon',
        'lay',
        'giu',
        'dat',
        'cho toi chuyen',
        'cho minh chuyen',
        'cho toi diem',
        'cho minh diem',
        'cho toi ghe',
        'cho minh ghe',
        'don o',
        'xuong o',
        'ngoi ghe',
    ])
    if (hasExplicitSelectionIntent) return false

    return (
        containsNormalizedPhrase(normalized, [
            'tai sao',
            'vi sao',
            'sao lai',
            'bao nhieu',
            'bao lau',
            'khi nao',
            'luc nao',
            'o dau',
            'the nao',
            'la gi',
            'hoi',
        ]) || /\bco\b.+\bkhong\b/u.test(normalized)
    )
}

function cleanupLocation(value?: string) {
    if (!value) return undefined
    return value
        .replace(/^(?:có xe|co xe|xe|vé|ve|chuyến|chuyen|tuyến|tuyen)\s+/iu, '')
        .replace(/\s+(?:có|co)\s+(?:chuyến|chuyen|xe|vé|ve)\b.*$/iu, '')
        .replace(/\s+(?:(?:vào|vao)\s+)?(?:ngày|ngay)\b.*$/iu, '')
        .replace(/\s+(?:lúc|luc)\b.*$/iu, '')
        .replace(/\s+(?:(?:buổi|buoi)\s+)?(?:sáng|sang|chiều|chieu|tối|toi|đêm|dem|khuya)$/iu, '')
        .replace(
            /\s+(?:hôm nay|hom nay|ngày mai|ngay mai|mai|ngày mốt|ngay mot|mốt|mot|ngày kia|ngay kia)$/iu,
            ''
        )
        .replace(/\s+(?:không|khong|ko|không vậy|khong vay|nhé|nhe)$/iu, '')
        .trim()
}

function isLikelyDirectRoute(match: RegExpMatchArray) {
    const from = normalizeSearch(match[1])
    const to = normalizeSearch(match[2])
    const nonLocationWords = ['anh', 'ban', 'chi', 'em', 'minh', 'muon', 'toi']
    return (
        from.length > 1 &&
        to.length > 1 &&
        !from.split(' ').some(word => nonLocationWords.includes(word))
    )
}

function extractDate(message: string) {
    const normalized = normalizeSearch(message)
    if (
        containsNormalizedPhrase(normalized, [
            'hom nay',
            'bua nay',
            'sang nay',
            'chieu nay',
            'toi nay',
            'dem nay',
            'today',
        ])
    ) {
        return utils.time.getRelativeAppCalendarDate(0)
    }
    if (
        containsNormalizedPhrase(normalized, [
            'ngay mai',
            'sang mai',
            'chieu mai',
            'toi mai',
            'dem mai',
            'mai',
            'tomorrow',
        ])
    ) {
        return utils.time.getRelativeAppCalendarDate(1)
    }
    if (
        containsNormalizedPhrase(normalized, ['ngay mot', 'ngay kia']) ||
        /\bmốt\b/iu.test(message) ||
        normalized === 'mot'
    ) {
        return utils.time.getRelativeAppCalendarDate(2)
    }

    const iso = message.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
    if (iso) {
        return utils.time.getAppCalendarDate({
            year: Number(iso[1]),
            month: Number(iso[2]),
            day: Number(iso[3]),
        })
    }

    const slash = message.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
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

function getStringArg(args: Record<string, unknown>, key: string) {
    const value = args[key]
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getDateArg(args: Record<string, unknown>, key: string) {
    const value = args[key]
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value
    if (typeof value !== 'string') return undefined
    return extractDate(value) ?? extractDate(`ngày ${value}`)
}

function getPreferredTimeArg(
    args: Record<string, unknown>,
    key: string
): PreferredTime | undefined {
    const value = args[key]
    return value === 'morning' || value === 'afternoon' || value === 'evening' || value === 'night'
        ? value
        : undefined
}

function extractPreferredTime(message: string): PreferredTime | undefined {
    const normalized = normalizeSearch(message)
    if (
        /\bsáng\b/iu.test(message) ||
        containsNormalizedPhrase(normalized, ['buoi sang', 'sang nay', 'sang mai', 'morning'])
    ) {
        return 'morning'
    }
    if (
        /\bchiều\b/iu.test(message) ||
        containsNormalizedPhrase(normalized, ['buoi chieu', 'chieu nay', 'chieu mai', 'afternoon'])
    ) {
        return 'afternoon'
    }
    if (
        /\btối\b/iu.test(message) ||
        containsNormalizedPhrase(normalized, ['buoi toi', 'toi nay', 'toi mai', 'evening'])
    ) {
        return 'evening'
    }
    if (
        /\bđêm\b/iu.test(message) ||
        containsNormalizedPhrase(normalized, ['buoi dem', 'dem nay', 'dem mai', 'khuya', 'night'])
    ) {
        return 'night'
    }
}

function isTimeInPreferredRange(departureTime: string, preferredTime: PreferredTime) {
    const hour = Number(formatTime(departureTime).slice(0, 2))
    if (preferredTime === 'morning') return hour >= 5 && hour < 12
    if (preferredTime === 'afternoon') return hour >= 12 && hour < 18
    if (preferredTime === 'evening') return hour >= 18 && hour < 22
    return hour >= 22 || hour < 5
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
        .map(
            (item, index) =>
                `${index + 1}. ${item.address}, ${item.city}${item.price !== undefined ? ` - ${formatMoney(item.price)}` : ''}`
        )
        .join('\n')
}

function formatSeatOptions(options: AiChatSeatOption[]) {
    const floors = [
        ['Tầng 1', options.filter(item => item.type === 1)],
        ['Tầng 2', options.filter(item => item.type === 2)],
    ] as const
    const lines = [`Tổng còn ${options.length} ghế.`]
    for (const [label, seats] of floors) {
        for (let index = 0; index < seats.length; index += SEAT_OPTIONS_PER_LINE) {
            const prefix = index === 0 ? `${label}: ` : '        '
            lines.push(
                `${prefix}${seats
                    .slice(index, index + SEAT_OPTIONS_PER_LINE)
                    .map(item => item.seatNumber)
                    .join(', ')}`
            )
        }
    }
    return lines.join('\n')
}

function formatTime(value: string) {
    return value.slice(0, 5)
}

function formatDisplayDate(value: Date) {
    return utils.time.formatCalendarDate(value, 'DD/MM/YYYY')
}

function formatMoney(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function containsAny(value: string, patterns: string[]) {
    const normalized = normalizeSearch(value)
    return patterns.some(pattern => normalized.includes(normalizeSearch(pattern)))
}

function containsNormalizedPhrase(value: string, patterns: string[]) {
    const normalized = ` ${normalizeSearch(value)} `
    return patterns.some(pattern => normalized.includes(` ${normalizeSearch(pattern)} `))
}

function normalizeSearch(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
