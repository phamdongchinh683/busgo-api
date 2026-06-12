import { db } from '../../../datasource/db.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { OperationTripStopTemplateId } from './type.js'
import { OperationTripStopTemplateTableUpdate } from './table.js'
import { OperationRouteId } from '../route/type.js'

export async function getStoppingPointByScheduleId(params: {
    scheduleId: OperationTripScheduleId
    routeId?: OperationRouteId
}) {
    const { scheduleId, routeId } = params
    return db
        .selectFrom('operation.trip_stop_template as ts')
        .innerJoin('operation.station as s', 'ts.stationId', 's.id')
        .innerJoin('operation.route as r', 'ts.routeId', 'r.id')
        .where(eb => {
            const cond = []
            cond.push(eb('ts.scheduleId', '=', scheduleId))
            if (routeId) {
                cond.push(eb('r.id', '=', routeId))
            }
            return eb.and(cond)
        })
        .select([
            'ts.publicId as id',
            'ts.stopOrder',
            'ts.stationId',
            's.address',
            's.city',
            'ts.stopOrder',
            'ts.allowPickup',
            'ts.allowDropoff',
            'ts.scheduleId',
        ])
        .orderBy('ts.stopOrder')
        .execute()
}

export async function updateOneById(
    id: OperationTripStopTemplateId,
    data: OperationTripStopTemplateTableUpdate
) {
    return db
        .updateTable('operation.trip_stop_template as ts')
        .set(data)
        .where(eb => {
            const cond = []
            cond.push(eb('ts.id', '=', id))
            if (data.companyId) {
                cond.push(eb('ts.companyId', '=', data.companyId))
            }
            return eb.and(cond)
        })
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}
