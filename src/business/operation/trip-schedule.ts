import { TripScheduleFilter } from '../../model/query/trip-schedule/index.js'
import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { TripScheduleBody, TripScheduleUpdateBody } from '../../model/body/trip-schedule/index.js'
import { UserInfo } from '../../model/common.js'
import { HttpErr } from '../../app/index.js'
import { OperationStationId } from '../../database/operation/station/type.js'

type InternalTripStopPickUpItem = {
    stationId: OperationStationId
    stopOrder: number
    address: string
    city: string
}

const TRIP_SCHEDULE_PUBLIC_LIST_CACHE_PREFIX = 'trip-schedule:public:list:v2'
const TRIP_SCHEDULE_COMPANY_LIST_CACHE_PREFIX = 'trip-schedule:company:list:v2'
const TRIP_SCHEDULE_LIST_CACHE_TTL_SECONDS = 3600

function getTripScheduleCompanyListCachePrefix(companyId: OrganizationBusCompanyId) {
    return `${TRIP_SCHEDULE_COMPANY_LIST_CACHE_PREFIX}:${companyId}`
}

function getTripScheduleListCacheTtl(query: TripScheduleFilter) {
    if (!query.date) {
        return TRIP_SCHEDULE_LIST_CACHE_TTL_SECONDS
    }

    const now = utils.time.getNow()
    const today = now.format('YYYY-MM-DD')
    const searchDate = utils.time.formatCalendarDate(query.date, 'YYYY-MM-DD')

    if (searchDate === today) {
        return 0
    }

    const secondsUntilTomorrow = now.add(1, 'day').startOf('day').diff(now, 'second')

    return Math.min(TRIP_SCHEDULE_LIST_CACHE_TTL_SECONDS, Math.max(secondsUntilTomorrow, 1))
}

export async function clearTripScheduleListCache(companyId?: OrganizationBusCompanyId) {
    await Promise.all([
        utils.cache.delCacheByPattern(`${TRIP_SCHEDULE_PUBLIC_LIST_CACHE_PREFIX}:*`),
        utils.cache.delCacheByPattern(
            companyId
                ? `${getTripScheduleCompanyListCachePrefix(companyId)}:*`
                : `${TRIP_SCHEDULE_COMPANY_LIST_CACHE_PREFIX}:*`
        ),
    ])
}

export async function getTripSchedules(query: TripScheduleFilter) {
    return utils.cache.cacheQuery({
        prefix: TRIP_SCHEDULE_PUBLIC_LIST_CACHE_PREFIX,
        query,
        ttl: getTripScheduleListCacheTtl(query),
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
        prefix: getTripScheduleCompanyListCachePrefix(companyId),
        query,
        ttl: getTripScheduleListCacheTtl(query),
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
    const tripSchedule = await dal.operation.tripSchedule.cmd.updateOneById(params)

    await Promise.all([
        clearTripScheduleListCache(params.companyId),
        utils.cache.delCache(`trip-schedule:pickup-stops:${params.id}`),
    ])

    return {
        tripSchedule,
    }
}

export async function createTripSchedule(params: { body: TripScheduleBody; user: UserInfo }) {
    if (!params.user.companyId || params.user.companyId !== params.body.companyId) {
        throw new HttpErr.Forbidden('Bạn không có quyền tạo lịch trình cho công ty này.')
    }

    const tripSchedule = await dal.operation.tripSchedule.cmd.upsertOne(params.body)

    await clearTripScheduleListCache(params.body.companyId)

    return {
        tripSchedule,
    }
}

export async function getPickupStops(id: OperationTripScheduleId) {
    const cacheKey = `trip-schedule:pickup-stops:${id}`

    const cached = await utils.cache.getCache<InternalTripStopPickUpItem[]>(cacheKey)

    if (cached !== null) {
        return {
            tripStops: cached,
        }
    }

    const tripStops = await dal.operation.tripSchedule.cmd.findAllPickupStop(id)

    await utils.cache.setCache(cacheKey, tripStops, 60 * 5)

    return {
        tripStops,
    }
}

export async function getPickupStopsPublic(id: OperationTripScheduleId) {
    return {
        tripStops: await dal.operation.tripSchedule.query.getPickupStopsPublicByScheduleId(id),
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

export async function getDropoffStopsPublic(
    id: OperationTripScheduleId,
    fromStationId: OperationStationId,
    stopOrder: number
) {
    return {
        tripStops: await dal.operation.tripSchedule.query.getDropoffStopsPublicWithPrice(
            id,
            fromStationId,
            stopOrder
        ),
    }
}

export async function deleteTripSchedule(params: {
    id: OperationTripScheduleId
    companyId: OrganizationBusCompanyId
}) {
    const tripSchedule = await dal.operation.tripSchedule.cmd.deleteOneById(
        params.id,
        params.companyId
    )

    await Promise.all([
        clearTripScheduleListCache(tripSchedule.companyId),
        utils.cache.delCache(`trip-schedule:pickup-stops:${params.id}`),
    ])

    return {
        tripSchedule,
    }
}
