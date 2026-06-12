import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { OperationTripId } from '../../database/operation/trip/type.js'
import { OperationRouteBody } from '../../model/body/route/index.js'
import { RouteFilter } from '../../model/query/route/index.js'
import { utils } from '../../utils/index.js'
import { clearTripScheduleListCache } from './trip-schedule.js'

export async function getRouterByTripId(params: { driverId: AuthUserId; tripId: OperationTripId }) {
    const { driverId, tripId } = params

    return {
        stops: await dal.operation.route.cmd.getRouterByDriverIdAndTripId({ driverId, tripId }),
    }
}

export async function createRoute(params: { body: OperationRouteBody }) {
    const { body } = params
    const route = await dal.operation.route.cmd.createRoute(body)

    await Promise.all([utils.cache.delCacheByPattern('route:list:*'), clearTripScheduleListCache()])

    return {
        route,
    }
}

export async function getRoutes(q: RouteFilter) {
    return utils.cache.cacheQuery({
        prefix: 'route:list',
        query: q,
        ttl: 3600,
        queryFn: async () => {
            const routes = await dal.operation.route.query.findAll(q)

            const { data, next } = utils.common.paginateByCursor(routes, q.limit)

            return {
                routes: data,
                next,
            }
        },
    })
}
