import { db } from '../../../datasource/db.js'
import { OperationTripId } from '../trip/type.js'
import { Transaction, sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OperationRouteTableInsert } from './table.js'
import _ from 'lodash'
import { HttpErr } from '../../../app/index.js'

export async function getRouterByDriverIdAndTripId(
    params: {
        driverId: AuthUserId
        tripId: OperationTripId
    },
    trx?: Transaction<Database>
) {
    const { driverId, tripId } = params
    return (trx ?? db)
        .selectFrom('operation.route as r')
        .innerJoin('operation.trip as t', 't.routeId', 'r.id')
        .innerJoin('operation.trip_stop_template as tst', 'tst.routeId', 'r.id')
        .innerJoin('operation.station as s', 's.id', 'tst.stationId')
        .where(eb => {
            const cond = []
            cond.push(eb('t.id', '=', tripId))
            cond.push(sql<boolean>`t.driver_ids @> ARRAY[${driverId}]::int[]`)
            return eb.and(cond)
        })
        .select(['s.address', 's.city', 'tst.stopOrder'])
        .orderBy('tst.stopOrder')
        .execute()
}

export async function createRoute(params: OperationRouteTableInsert, trx?: Transaction<Database>) {
    const data = _.omitBy(params, v => _.isNil(v)) as OperationRouteTableInsert
    const route = await (trx ?? db)
        .insertInto('operation.route')
        .values(data)
        .onConflict(oc => oc.columns(['fromLocation', 'toLocation']).doNothing())
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirst()

    if (!route) {
        throw new HttpErr.UnprocessableEntity('Tuyến đường đã tồn tại.', 'ROUTE_ALREADY_EXISTS')
    }

    return route
}
