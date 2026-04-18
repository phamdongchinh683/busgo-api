import { AuthUserId } from '../../database/auth/user/type.js'
import { OperationTripId, OperationTripStatus } from '../../database/operation/trip/type.js'
import { dal } from '../../database/index.js'
import { TripBody } from '../../model/body/trip/index.js'
import { DriverTripQuery, TripFilter } from '../../model/query/trip/index.js'
import { PassengerTicketFilter } from '../../model/query/ticket/index.js'
import { utils } from '../../utils/index.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { OperationTripTableUpdate } from '../../database/operation/trip/table.js'

export async function getTrips(query: TripFilter) {
    const trips = await dal.operation.trip.cmd.getManyByFilter(query)

    const { data, next } = utils.common.paginateByCursor(trips, query.limit)

    return {
        trips: data,
        next: next,
    }
}

export async function prepareTrip(body: TripBody) {
    return dal.operation.trip.cmd.createTripTransaction(body)
}

export async function getPassengerList(
    params: { tripId: OperationTripId; driverId: AuthUserId },
    q: PassengerTicketFilter
) {
    const { tripId, driverId } = params
    const passengers = await dal.booking.ticket.query.findPassengersByDriverAndTripId(
        { tripId, driverId },
        q
    )

    const { data, next } = utils.common.paginateByCursor(passengers, q.limit)

    return {
        passengers: data,
        next: next,
    }
}

export async function getDriverTrips(query: DriverTripQuery, userId: AuthUserId) {
    const trips = await dal.operation.trip.cmd.getManyByDriverId(query, userId)

    const { data, next } = utils.common.paginateByCursor(trips, query.limit)

    return {
        trips: data,
        next,
    }
}

export async function updateTripStatus(params: {
    id: OperationTripId
    status: OperationTripStatus
    userId: AuthUserId
}) {
    return dal.operation.trip.cmd.updateStatus(params)
}

export async function getTripByScheduleId(q: TripFilter, scheduleId: OperationTripScheduleId) {
    const trips = await dal.operation.trip.query.findAllByFilter(q, scheduleId)
    const { data, next } = utils.common.paginateByCursor(trips, q.limit)

    return {
        trips: data,
        next: next,
    }
}

export async function updateTrip(
    ids: { scheduleId: OperationTripScheduleId; tripId: OperationTripId },
    body: OperationTripTableUpdate
) {
    return {
        trip: await dal.operation.trip.query.updateOneById(ids, body),
    }
}

export async function cleanupTrips() {
    await dal.operation.trip.cmd.deleteTripsBeforeToday()
    return {
        message: 'OK',
    }
}
