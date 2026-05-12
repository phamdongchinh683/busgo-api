import { db } from '../../../datasource/db.js'
import { DriverTripQuery, TripFilter } from '../../../model/query/trip/index.js'
import { OperationTripId, OperationTripStatus } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { utils } from '../../../utils/index.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { OperationTripTableUpdate } from './table.js'
import _ from 'lodash'

export async function findAllByFilter(filter: TripFilter, scheduleId?: OperationTripScheduleId) {
    const { limit, next, from, to, date, orderBy, status } = filter
    return db
        .selectFrom('operation.trip as t')
        .innerJoin('operation.route as r', 't.routeId', 'r.id')
        .innerJoin('organization.vehicle as v', 'v.id', 't.vehicleId')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'v.companyId')
        .where(eb => {
            const cond = []

            if (from) {
                cond.push(eb('r.fromLocation', '=', from))
            }
            if (to) {
                cond.push(eb('r.toLocation', '=', to))
            }
            if (date) {
                cond.push(eb('t.departureDate', '=', date))
            }

            if (next) {
                cond.push(eb('t.id', '>', next))
            }

            if (scheduleId) {
                cond.push(eb('t.scheduleId', '=', scheduleId))
            }

            if (status) {
                cond.push(eb('t.status', '=', status))
            }

            return eb.and(cond)
        })
        .select([
            't.id',
            'bc.name as companyName',
            'bc.logoUrl',
            'v.plateNumber',
            'v.type',
            'v.totalSeats',
            'r.fromLocation',
            'r.toLocation',
            'r.distanceKm',
            'r.durationMinutes',
            't.status',
        ])
        .groupBy([
            't.id',
            'bc.name',
            'bc.logoUrl',
            'v.plateNumber',
            'v.type',
            'v.totalSeats',
            'r.fromLocation',
            'r.toLocation',
            'r.distanceKm',
            'r.durationMinutes',
        ])
        .orderBy('t.id', orderBy)
        .limit(limit + 1)
        .execute()
}

export async function findAllByDriverId(params: DriverTripQuery, userId: AuthUserId) {
    const { limit, next, date, orderBy } = params
    const now = utils.time.getNow().toDate()
    return db
        .selectFrom('operation.trip as t')
        .innerJoin('operation.route as r', 'r.id', 't.routeId')
        .innerJoin('organization.vehicle as v', 'v.id', 't.vehicleId')
        .innerJoin('operation.trip_schedule as ts', 'ts.id', 't.scheduleId')
        .where(eb => {
            const cond = []
            cond.push(eb('t.driverId', '=', userId))
            cond.push(eb('t.status', '=', OperationTripStatus.enum.scheduled))
            if (!date) {
                cond.push(eb('t.departureDate', '=', now))
            } else {
                cond.push(eb('t.departureDate', '=', date))
            }
            if (next) {
                cond.push(eb('t.id', '>', next))
            }

            return eb.and(cond)
        })
        .select([
            't.id',
            'v.plateNumber',
            'v.type',
            't.status',
            'v.totalSeats',
            'r.fromLocation',
            'r.toLocation',
            'r.distanceKm',
            'r.durationMinutes',
            'ts.departureTime',
            't.departureDate',
        ])
        .limit(limit + 1)
        .orderBy('ts.departureTime', orderBy)
        .execute()
}

export async function updateOneById(
    params: { scheduleId: OperationTripScheduleId; tripId: OperationTripId },
    body: OperationTripTableUpdate
) {
    const data = _.omitBy(body, v => _.isNil(v))

    return db
        .updateTable('operation.trip as t')
        .set(data)
        .where(eb => {
            const cond = []
            cond.push(eb('t.scheduleId', '=', params.scheduleId))
            cond.push(eb('t.id', '=', params.tripId))
            return eb.and(cond)
        })
        .returning([
            't.id',
            't.routeId',
            't.vehicleId',
            't.scheduleId',
            't.driverId',
            't.departureDate',
            't.status',
        ])
        .executeTakeFirstOrThrow()
}

export async function findByScheduleIdAndDepartureDate(params: {
    scheduleId: OperationTripScheduleId
    departureDate: Date
}) {
    return db
        .selectFrom('operation.trip as t')
        .where(eb => {
            const cond = []
            cond.push(eb('t.scheduleId', '=', params.scheduleId))
            cond.push(eb('t.departureDate', '=', params.departureDate))
            return eb.and(cond)
        })
        .selectAll()
        .executeTakeFirstOrThrow()
}

export async function findById(id: OperationTripId) {
    return db
        .selectFrom('operation.trip as t')
        .innerJoin('operation.trip_schedule as ts', 'ts.id', 't.scheduleId')
        .where(eb => {
            const cond = []
            cond.push(eb('t.id', '=', id))
            cond.push(eb('t.status', '=', OperationTripStatus.enum.completed))
            return eb.and(cond)
        })
        .select(['t.id', 't.status', 'ts.companyId'])
        .executeTakeFirstOrThrow()
}
