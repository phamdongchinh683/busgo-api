import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { OperationTripScheduleTableInsert } from './table.js'
import { db } from '../../../datasource/db.js'
import { OperationStationId } from '../station/type.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { sql } from 'kysely'
import { utils } from '../../../utils/index.js'

export async function findAllByFilter(
    query: TripScheduleFilter,
    companyId?: OrganizationBusCompanyId
) {
    const { limit, next, from, to, date, orderBy } = query

    const today = utils.time.getNow().format('YYYY-MM-DD')
    const nowTime = utils.time.getNow().format('HH:mm:ss')

    return db
        .selectFrom('operation.trip_schedule as ts')
        .innerJoin('operation.route as r', 'r.id', 'ts.routeId')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'ts.companyId')
        .select([
            'ts.id',
            'ts.departureTime',
            'bc.name',
            'bc.logoUrl',
            'bc.hotline',
            'ts.routeId',
            'r.fromLocation',
            'r.toLocation',
            'ts.companyId',
            'r.distanceKm',
            sql<string>`to_char(ts.start_date, 'YYYY-MM-DD')`.as('startDate'),
            sql<string>`to_char(ts.end_date, 'YYYY-MM-DD')`.as('endDate'),
            'r.durationMinutes',
            'bc.reviewAvgStars as totalStars',
        ])
        .where(eb => {
            const cond = []

            cond.push(eb('ts.status', '=', true))

            if (from) {
                cond.push(eb('r.fromLocation', '=', from))
            }

            if (to) {
                cond.push(eb('r.toLocation', '=', to))
            }

            if (date) {
                cond.push(eb('ts.startDate', '<=', date))
                cond.push(eb('ts.endDate', '>=', date))

                cond.push(
                    eb.or([
                        eb(sql`${date}`, '>', today),
                        eb.and([
                            eb(sql`${date}`, '=', today),
                            sql<boolean>`ts.departure_time > ${nowTime}::time`,
                        ]),
                    ])
                )
            }

            if (companyId) {
                cond.push(eb('ts.companyId', '=', companyId))
            }

            if (next) {
                cond.push(eb('ts.id', '>', next))
            }

            return eb.and(cond)
        })
        .limit(limit + 1)
        .orderBy('ts.departureTime', orderBy)
        .orderBy('bc.reviewAvgStars', orderBy)
        .execute()
}

export async function createOne(params: OperationTripScheduleTableInsert) {
    return db
        .insertInto('operation.trip_schedule')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getPickupStopsByScheduleId(id: OperationTripScheduleId) {
    return db
        .selectFrom('operation.trip_stop_template as ts')
        .innerJoin('operation.station as s', 'ts.stationId', 's.id')
        .where(eb => eb.and([eb('ts.scheduleId', '=', id), eb('ts.allowPickup', '=', true)]))
        .select(['ts.stopOrder', 'ts.stationId', 's.address', 's.city', 'ts.stopOrder'])
        .orderBy('ts.stopOrder')
        .execute()
}

export async function getDropoffStopsWithPrice(
    scheduleId: OperationTripScheduleId,
    fromStationId: OperationStationId,
    stopOrder: number
) {
    return db
        .selectFrom('operation.trip_stop_template as ts')
        .innerJoin('operation.station as s', 'ts.stationId', 's.id')
        .innerJoin('operation.trip_price_template as tp', join =>
            join
                .onRef('tp.routeId', '=', 'ts.routeId')
                .onRef('tp.companyId', '=', 'ts.companyId')
                .on('tp.fromStationId', '=', fromStationId)
                .onRef('tp.toStationId', '=', 'ts.stationId')
        )
        .where(eb =>
            eb.and([
                eb('ts.scheduleId', '=', scheduleId),
                eb('ts.allowDropoff', '=', true),
                eb('ts.stopOrder', '>', stopOrder),
            ])
        )
        .select(['ts.stationId', 's.address', 's.city', 'ts.stopOrder', 'tp.price'])
        .orderBy('ts.stopOrder')
        .execute()
}
