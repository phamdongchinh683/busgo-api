import { db } from '../../../datasource/db.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { OperationTripStopTemplateId } from './type.js'
import { OperationTripStopTemplateTableUpdate } from './table.js'

export async function getStoppingPointByScheduleId(id: OperationTripScheduleId) {
    return db
        .selectFrom('operation.trip_stop_template as ts')
        .innerJoin('operation.station as s', 'ts.stationId', 's.id')
        .where('ts.scheduleId', '=', id)
        .select([
            'ts.id',
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
            return eb.and(cond)
        })
        .returningAll()
        .executeTakeFirstOrThrow()
}
