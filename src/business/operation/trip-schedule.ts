import { TripScheduleFilter } from '../../model/query/trip-schedule/index.js'
import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { TripScheduleBody, TripScheduleUpdateBody } from '../../model/body/trip-schedule/index.js'
import { UserInfo } from '../../model/common.js'
import { HttpErr } from '../../app/index.js'
import { OperationStationId } from '../../database/operation/station/type.js'

export async function getTripSchedules(query: TripScheduleFilter) {
    return utils.cache.cacheQuery({
        prefix: 'trip-schedule:list',
        query,
        ttl: 3600,
        queryFn: async () => {
            const tripSchedules = await dal.operation.tripSchedule.cmd.getTripSchedules(query)

            const { data, next } = utils.common.paginateByCursor(tripSchedules, query.limit)

            return {
                trip: data,
                next,
            }
        },
    })
}

export async function getTripSchedulesByCompanyId(
    query: TripScheduleFilter,
    companyId: OrganizationBusCompanyId
) {
    return utils.cache.cacheQuery({
        prefix: `trip-schedule:list:${companyId}`,
        query,
        ttl: 3600,
        queryFn: async () => {
            const tripSchedules = await dal.operation.tripSchedule.query.findAllByFilter(
                query,
                companyId
            )

            const { data, next } = utils.common.paginateByCursor(tripSchedules, query.limit)

            return {
                trip: data,
                next: next,
            }
        },
    })
}

export async function updateTripSchedule(params: {
    id: OperationTripScheduleId
    companyId: OrganizationBusCompanyId
    body: TripScheduleUpdateBody
}) {
    await utils.cache.delCacheByPattern('trip-schedule:list:*')
    return {
        tripSchedule: await dal.operation.tripSchedule.cmd.updateOneById(params),
    }
}

export async function createTripSchedule(params: { body: TripScheduleBody; user: UserInfo }) {
    if (!params.user.companyId || params.user.companyId !== params.body.companyId) {
        throw new HttpErr.Forbidden('You are not allowed to create trip schedule for this company')
    }

    await utils.cache.delCacheByPattern('trip-schedule:list:*')

    return {
        tripSchedule: await dal.operation.tripSchedule.cmd.upsertOne(params.body),
    }
}

export async function getPickupStops(id: OperationTripScheduleId) {
    return {
        tripStops: await dal.operation.tripSchedule.cmd.findAllPickupStop(id),
    }
}

export async function getDropoffStops(
    id: OperationTripScheduleId,
    fromStationId: OperationStationId,
    stopOrder: number
) {
    return {
        tripStops: await dal.operation.tripSchedule.cmd.findAllDropoffStop(
            id,
            fromStationId,
            stopOrder
        ),
    }
}

export async function deleteTripSchedule(params: { id: OperationTripScheduleId }) {
    return {
        tripSchedule: await dal.operation.tripSchedule.cmd.deleteOneById(params.id),
    }
}
