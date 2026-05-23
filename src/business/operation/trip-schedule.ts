import { TripScheduleFilter } from '../../model/query/trip-schedule/index.js'
import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { TripScheduleBody, TripScheduleResponse, TripScheduleUpdateBody } from '../../model/body/trip-schedule/index.js'
import { UserInfo } from '../../model/common.js'
import { HttpErr } from '../../app/index.js'
import { OperationStationId } from '../../database/operation/station/type.js'

export async function getTripSchedules(query: TripScheduleFilter) {
    const key = utils.cache.cacheKey('trip-schedule:list', query)

    
    const cached = await utils.cache.getCache<TripScheduleResponse>(key)

    if (cached) {
        return cached
    }

    const tripSchedules = await dal.operation.tripSchedule.cmd.getTripSchedules(query)

    const { data, next } = utils.common.paginateByCursor(tripSchedules, query.limit)

    const response = {
        trip: data,
        next,
    }

    void utils.cache.setCache(key, response, 60)

    return response
}

export async function getTripSchedulesByCompanyId(
    query: TripScheduleFilter,
    companyId: OrganizationBusCompanyId
) {
    const tripSchedules = await dal.operation.tripSchedule.query.findAllByFilter(query, companyId)

    const { data, next } = utils.common.paginateByCursor(tripSchedules, query.limit)

    return {
        trip: data,
        next: next,
    }
}

export async function updateTripSchedule(params: {
    id: OperationTripScheduleId
    companyId: OrganizationBusCompanyId
    body: TripScheduleUpdateBody
}) {
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
