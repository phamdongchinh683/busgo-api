import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { OperationTripScheduleTableInsert } from './table.js'
import { db } from '../../../datasource/db.js'
import { OperationStationId } from '../station/type.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { sql } from 'kysely'

export async function findAllByFilter(
    query: TripScheduleFilter,
    companyId?: OrganizationBusCompanyId
) {
    const { limit = 10, next, from, to, date, orderBy } = query
    const vietnameseChars =
        'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ' +
        'ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ'
    const asciiChars =
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd' +
        'AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'

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
            'r.durationMinutes',
        ])

        .where(eb => {
            const cond = []
            cond.push(eb('ts.status', '=', true))
            if (from) {
                cond.push(sql<boolean>`
            translate(lower(r.from_location), ${vietnameseChars}, ${asciiChars}) ILIKE
            translate(lower(${`%${from}%`}::text), ${vietnameseChars}, ${asciiChars})
                `)
            }
            if (to) {
                cond.push(sql<boolean>`
            translate(lower(r.to_location), ${vietnameseChars}, ${asciiChars}) ILIKE
            translate(lower(${`%${to}%`}::text), ${vietnameseChars}, ${asciiChars})
                `)
            }
            if (date) {
                cond.push(eb('ts.startDate', '<=', date))
                cond.push(eb('ts.endDate', '>=', date))
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
