import _ from 'lodash'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { OperationRouteTableUpdate } from '../../database/operation/route/table.js'
import { OperationRouteId } from '../../database/operation/route/type.js'
import { OperationTripId } from '../../database/operation/trip/type.js'
import { OperationRouteBody } from '../../model/body/route/index.js'
import { RouteFilter } from '../../model/query/route/index.js'
import { utils } from '../../utils/index.js'

export async function getRouterByTripId(params: { driverId: AuthUserId; tripId: OperationTripId }) {
    const { driverId, tripId } = params

    return {
        stops: await dal.operation.route.cmd.getRouterByDriverIdAndTripId({ driverId, tripId }),
    }
}

export async function createRoute(params: { body: OperationRouteBody }) {
    const { body } = params

    return {
        route: await dal.operation.route.cmd.createRoute(body),
    }
}

export async function getRoutes(q: RouteFilter) {
    const routes = await dal.operation.route.query.findAll(q)

    const { data, next } = utils.common.paginateByCursor(routes, q.limit)

    return {
        routes: data,
        next: next,
    }
}

export async function updateRoute(params: {
    id: OperationRouteId
    body: OperationRouteTableUpdate
}) {
    const { id, body } = params

    const data = _.omitBy(body, v => _.isNil(v)) as OperationRouteTableUpdate

    return {
        route: await dal.operation.route.cmd.updateOneById({ id, body: data }),
    }
}
