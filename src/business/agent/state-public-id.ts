import { dal } from '../../database/index.js'
import {
    AiChatPublicResponse,
    AiChatPublicState,
    AiChatResponse,
    AiChatState,
} from '../../model/body/chat/index.js'

async function resolveScheduleOption(option: NonNullable<AiChatPublicState['selectedSchedule']>) {
    return {
        ...option,
        scheduleId: await dal.publicId.query.resolve('tripSchedule', option.scheduleId),
    }
}

async function resolveStopOption(option: NonNullable<AiChatPublicState['selectedPickup']>) {
    return {
        ...option,
        stationId: await dal.publicId.query.resolve('station', option.stationId),
    }
}

async function resolveSeatOption(option: NonNullable<AiChatPublicState['selectedSeat']>) {
    return {
        ...option,
        seatId: await dal.publicId.query.resolve('seat', option.seatId),
    }
}

async function publicScheduleOption(option: NonNullable<AiChatState['selectedSchedule']>) {
    return {
        ...option,
        scheduleId: await dal.publicId.query.toPublicId('tripSchedule', option.scheduleId),
    }
}

async function publicStopOption(option: NonNullable<AiChatState['selectedPickup']>) {
    return {
        ...option,
        stationId: await dal.publicId.query.toPublicId('station', option.stationId),
    }
}

async function publicSeatOption(option: NonNullable<AiChatState['selectedSeat']>) {
    return {
        ...option,
        seatId: await dal.publicId.query.toPublicId('seat', option.seatId),
    }
}

export async function resolveState(state?: AiChatPublicState): Promise<AiChatState | undefined> {
    if (!state) return undefined

    const [
        scheduleOptions,
        selectedSchedule,
        pickupOptions,
        selectedPickup,
        dropoffOptions,
        selectedDropoff,
        seatOptions,
        selectedSeat,
        bookingId,
        couponId,
        fromStationId,
        scheduleId,
        ticketId,
        tripId,
    ] = await Promise.all([
        state.scheduleOptions
            ? Promise.all(state.scheduleOptions.map(resolveScheduleOption))
            : undefined,
        state.selectedSchedule ? resolveScheduleOption(state.selectedSchedule) : undefined,
        state.pickupOptions ? Promise.all(state.pickupOptions.map(resolveStopOption)) : undefined,
        state.selectedPickup ? resolveStopOption(state.selectedPickup) : undefined,
        state.dropoffOptions ? Promise.all(state.dropoffOptions.map(resolveStopOption)) : undefined,
        state.selectedDropoff ? resolveStopOption(state.selectedDropoff) : undefined,
        state.seatOptions ? Promise.all(state.seatOptions.map(resolveSeatOption)) : undefined,
        state.selectedSeat ? resolveSeatOption(state.selectedSeat) : undefined,
        state.bookingId ? dal.publicId.query.resolve('booking', state.bookingId) : undefined,
        state.couponId ? dal.publicId.query.resolve('coupon', state.couponId) : undefined,
        state.fromStationId
            ? dal.publicId.query.resolve('station', state.fromStationId)
            : undefined,
        state.scheduleId ? dal.publicId.query.resolve('tripSchedule', state.scheduleId) : undefined,
        state.ticketId ? dal.publicId.query.resolve('ticket', state.ticketId) : undefined,
        state.tripId ? dal.publicId.query.resolve('trip', state.tripId) : undefined,
    ])

    return AiChatState.parse({
        ...state,
        scheduleOptions,
        selectedSchedule,
        pickupOptions,
        selectedPickup,
        dropoffOptions,
        selectedDropoff,
        seatOptions,
        selectedSeat,
        bookingId,
        couponId,
        fromStationId,
        scheduleId,
        ticketId,
        tripId,
    })
}

export async function publicResponse(response: AiChatResponse): Promise<AiChatPublicResponse> {
    const state = response.state
    if (!state) return { message: response.message }

    const [
        scheduleOptions,
        selectedSchedule,
        pickupOptions,
        selectedPickup,
        dropoffOptions,
        selectedDropoff,
        seatOptions,
        selectedSeat,
        bookingId,
        couponId,
        fromStationId,
        scheduleId,
        ticketId,
        tripId,
    ] = await Promise.all([
        state.scheduleOptions
            ? Promise.all(state.scheduleOptions.map(publicScheduleOption))
            : undefined,
        state.selectedSchedule ? publicScheduleOption(state.selectedSchedule) : undefined,
        state.pickupOptions ? Promise.all(state.pickupOptions.map(publicStopOption)) : undefined,
        state.selectedPickup ? publicStopOption(state.selectedPickup) : undefined,
        state.dropoffOptions ? Promise.all(state.dropoffOptions.map(publicStopOption)) : undefined,
        state.selectedDropoff ? publicStopOption(state.selectedDropoff) : undefined,
        state.seatOptions ? Promise.all(state.seatOptions.map(publicSeatOption)) : undefined,
        state.selectedSeat ? publicSeatOption(state.selectedSeat) : undefined,
        state.bookingId ? dal.publicId.query.toPublicId('booking', state.bookingId) : undefined,
        state.couponId ? dal.publicId.query.toPublicId('coupon', state.couponId) : undefined,
        state.fromStationId
            ? dal.publicId.query.toPublicId('station', state.fromStationId)
            : undefined,
        state.scheduleId
            ? dal.publicId.query.toPublicId('tripSchedule', state.scheduleId)
            : undefined,
        state.ticketId ? dal.publicId.query.toPublicId('ticket', state.ticketId) : undefined,
        state.tripId ? dal.publicId.query.toPublicId('trip', state.tripId) : undefined,
    ])

    return AiChatPublicResponse.parse({
        ...response,
        state: {
            ...state,
            scheduleOptions,
            selectedSchedule,
            pickupOptions,
            selectedPickup,
            dropoffOptions,
            selectedDropoff,
            seatOptions,
            selectedSeat,
            bookingId,
            couponId,
            fromStationId,
            scheduleId,
            ticketId,
            tripId,
        },
    })
}
