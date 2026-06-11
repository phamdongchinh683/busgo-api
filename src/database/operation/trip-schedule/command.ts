import { db } from '../../../datasource/db.js'
import { OperationTripScheduleId } from './type.js'
import { Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'
import { dal } from '../../index.js'
import { OperationTripScheduleTableInsert } from './table.js'
import { HttpErr } from '../../../app/index.js'
import { TripScheduleUpdateBody } from '../../../model/body/trip-schedule/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { OperationStationId } from '../station/type.js'

export async function findByIdAndDate(
    params: {
        id: OperationTripScheduleId
        date: Date
    },
    trx?: Transaction<Database>
) {
    const { id, date } = params
    return (trx ?? db)
        .selectFrom('operation.trip_schedule')
        .where(eb => {
            const cond = []
            cond.push(eb('id', '=', id))
            cond.push(eb('startDate', '<=', date))
            cond.push(eb('endDate', '>=', date))
            cond.push(eb('status', '=', true))
            return eb.and(cond)
        })
        .select(['id', 'routeId', 'companyId', 'departureTime'])
        .executeTakeFirstOrThrow()
}

export async function findById(id: OperationTripScheduleId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('operation.trip_schedule')
        .where('id', '=', id)
        .select(['id', 'routeId', 'companyId', 'departureTime'])
        .executeTakeFirstOrThrow()
}

export async function getTripSchedules(query: TripScheduleFilter) {
    return dal.operation.tripSchedule.query.findAllByFilter(query)
}

export async function upsertOne(params: OperationTripScheduleTableInsert) {
    const inserted = await db
        .insertInto('operation.trip_schedule')
        .values(params)
        .onConflict(oc => oc.columns(['companyId', 'routeId']).doNothing())
        .returningAll()
        .executeTakeFirst()

    if (!inserted) {
        throw new HttpErr.UnprocessableEntity(
            'Lịch trình chuyến đi đã tồn tại.',
            'TRIP_SCHEDULE_ALREADY_EXISTS'
        )
    }

    return inserted
}

export async function updateOneById(params: {
    id: OperationTripScheduleId
    body: TripScheduleUpdateBody
    companyId: OrganizationBusCompanyId
}) {
    const { id, body, companyId } = params

    return db
        .updateTable('operation.trip_schedule as ts')
        .set(body)
        .where(eb => {
            const cond = []
            cond.push(eb('ts.id', '=', id))
            cond.push(eb('ts.companyId', '=', companyId))
            return eb.and(cond)
        })
        .returning([
            'ts.id',
            'ts.publicId',
            'ts.departureTime',
            'ts.startDate',
            'ts.endDate',
            'ts.status',
        ])
        .executeTakeFirstOrThrow()
}

export async function findAllPickupStop(id: OperationTripScheduleId) {
    return dal.operation.tripSchedule.query.getPickupStopsByScheduleId(id)
}

export async function findAllDropoffStop(
    id: OperationTripScheduleId,
    fromStationId: OperationStationId,
    stopOrder: number
) {
    return dal.operation.tripSchedule.query.getDropoffStopsWithPrice(id, fromStationId, stopOrder)
}

export async function deleteOneById(id: OperationTripScheduleId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .deleteFrom('operation.trip_schedule')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}
