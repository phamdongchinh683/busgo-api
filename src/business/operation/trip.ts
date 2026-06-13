import { AuthUserId } from '../../database/auth/user/type.js'
import { OperationTripId, OperationTripStatus } from '../../database/operation/trip/type.js'
import { dal } from '../../database/index.js'
import { TripBody } from '../../model/body/trip/index.js'
import { DriverTripQuery, TripFilter } from '../../model/query/trip/index.js'
import { utils } from '../../utils/index.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { OperationTripTableUpdate } from '../../database/operation/trip/table.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { HttpErr } from '../../app/index.js'
import { AuthUserRole } from '../../database/auth/user/type.js'

export async function prepareTrip(body: TripBody) {
    return dal.operation.trip.cmd.createTripTransaction(body)
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
    return dal.operation.trip.cmd.updateStatusForResponse(params)
}

export async function getTripByScheduleId(
    q: TripFilter,
    scheduleId: OperationTripScheduleId,
    companyId: OrganizationBusCompanyId
) {
    const trips = await dal.operation.trip.query.findAllByFilter(q, scheduleId, companyId)
    const { data, next } = utils.common.paginateByCursor(trips, q.limit)

    return {
        trips: data,
        next: next,
    }
}

export async function updateTrip(
    ids: {
        scheduleId: OperationTripScheduleId
        tripId: OperationTripId
        companyId: OrganizationBusCompanyId
    },
    body: OperationTripTableUpdate
) {
    if (body.vehicleId) {
        await dal.organization.vehicle.cmd.findById(body.vehicleId, ids.companyId)
    }

    if (body.driverIds?.length) {
        const members = await Promise.all(
            body.driverIds.map(driverId =>
                dal.organization.companyMember.query.getOne({
                    userId: driverId,
                    companyId: ids.companyId,
                })
            )
        )
        if (members.some(member => !member || member.role !== AuthUserRole.enum.driver)) {
            throw new HttpErr.Forbidden('Tài xế không thuộc công ty của bạn.')
        }
    }

    return {
        trip: await dal.operation.trip.query.updateOneById(ids, body),
    }
}

export async function cleanupTrips() {
    await dal.operation.trip.cmd.deleteTripsBeforeToday()
    return {
        message: 'Thành công',
    }
}

export async function updateTripStatusAndCount(params: {
    id: OperationTripId
    status: OperationTripStatus
    companyId: OrganizationBusCompanyId
    userId: AuthUserId
}) {
    return dal.operation.trip.cmd.updateTripAndUpCount(params)
}
