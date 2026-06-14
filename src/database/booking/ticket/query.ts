import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OperationTripId } from '../../operation/trip/type.js'
import {
    PassengerTicketFilter,
    TicketFilter,
    TicketSupportFilter,
} from '../../../model/query/ticket/index.js'
import { BookingTicketId } from './type.js'
import { PaymentStatus } from '../booking/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { Transaction, sql } from 'kysely'

export async function findAllByUserId(q: TicketFilter, userId: AuthUserId) {
    const { limit, next } = q
    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as ts', 'ts.id','trip.scheduleId' )
        .innerJoin('operation.route as r', 'r.id', 'ts.routeId')
        .where(eb => {
            const cond = [eb('b.userId', '=', userId)]
            if (next) cond.push(eb('t.id', '<', next))
            if (q.type) cond.push(eb('b.bookingType', '=', q.type))
            if (q.status) cond.push(eb('b.status', '=', q.status))
            return eb.and(cond)
        })
        .select([
            't.id',
            'trip.id as tripId',
            'b.code',
            'b.bookingType',
            'b.id as bookingId',
            'trip.departureDate',
            'b.originalAmount',
            'b.discountAmount',
            'b.totalAmount',
            'b.status',
            'trip.status as tripStatus',
            'b.expiredAt',
            'r.fromLocation as from',
            'r.toLocation as to',
            't.isRate',
        ])
        .orderBy('t.id', 'desc')
        .limit(limit + 1)
        .execute()
}

export async function findAll(q: TicketFilter, userId: AuthUserId) {
    const { limit, next } = q
    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .leftJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .where(eb => {
            const cond = []
            cond.push(eb('b.userId', '=', userId))
            if (next) {
                cond.push(eb('t.id', '<', next))
            }
            if (q.type) {
                cond.push(eb('b.bookingType', '=', q.type))
            }
            if (q.status) {
                cond.push(eb('b.status', '=', q.status))
            }

            return eb.and(cond)
        })
        .select(eb => [
            't.id',
            'trip.id as tripId',
            'b.code',
            'b.bookingType',
            'b.id as bookingId',
            'trip.departureDate',
            'b.originalAmount',
            'b.discountAmount',
            'b.totalAmount',
            'b.status',
            'trip.status as tripStatus',
            'b.expiredAt',
            eb
                .exists(
                    eb
                        .selectFrom('organization.bus_company_review as r')
                        .select('r.id')
                        .whereRef('r.ticketId', '=', 't.id')
                )
                .$castTo<boolean>()
                .as('isRated'),
        ])
        .orderBy('t.id', 'desc')
        .limit(limit + 1)
        .execute()
}

export async function findById(id: BookingTicketId, userId: AuthUserId) {
    return db
        .selectFrom('booking.ticket as t')
        .leftJoin('booking.booking as b', 'b.id', 't.bookingId')
        .leftJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .leftJoin('organization.seat as seat', 'seat.id', 't.seatId')
        .leftJoin('operation.route as route', 'route.id', 'trip.routeId')
        .leftJoin('operation.station as fs', 'fs.id', 't.fromStationId')
        .leftJoin('operation.station as ts', 'ts.id', 't.toStationId')
        .leftJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
        .leftJoin('operation.trip_schedule as tsp', 'tsp.id', 'trip.scheduleId')

        .where(eb => {
            const cond = []
            cond.push(eb('t.id', '=', id))
            cond.push(eb('b.userId', '=', userId))
            return eb.and(cond)
        })
        .select(eb => [
            't.id',
            'b.code',
            'b.bookingType',
            'b.originalAmount',
            'b.discountAmount',
            'b.totalAmount',
            'b.status',
            'seat.seatNumber',
            'v.plateNumber',
            'v.type',
            'route.fromLocation',
            'route.toLocation',
            'tsp.departureTime',
            'trip.departureDate',
            eb
                .exists(
                    eb
                        .selectFrom('organization.bus_company_review as r')
                        .select('r.id')
                        .whereRef('r.ticketId', '=', 't.id')
                )
                .$castTo<boolean>()
                .as('isRated'),
        ])
        .executeTakeFirstOrThrow()
}

export async function findPassengersByDriverAndTripId(
    params: {
        driverId: AuthUserId
        tripId: OperationTripId
    },
    query: PassengerTicketFilter
) {
    const { driverId, tripId } = params
    const { limit, next, phoneNumber } = query
    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .innerJoin('auth.user as u', 'u.id', 'b.userId')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .leftJoin('organization.seat as seat', 'seat.id', 't.seatId')
        .leftJoin('operation.station as fs', 'fs.id', 't.fromStationId')
        .leftJoin('operation.station as ts', 'ts.id', 't.toStationId')
        .where(eb => {
            const cond = []
            cond.push(eb('trip.id', '=', tripId))
            cond.push(sql<boolean>`trip.driver_ids @> ARRAY[${driverId}]::int[]`)
            cond.push(
                eb('b.status', 'in', [PaymentStatus.enum.success, PaymentStatus.enum.pending])
            )
            if (phoneNumber) {
                cond.push(eb('u.phone', '=', phoneNumber))
            }
            if (next) {
                cond.push(eb('t.id', '>', next))
            }
            return eb.and(cond)
        })
        .select([
            't.id',
            'u.phone',
            'u.firstName',
            'u.lastName',
            'seat.seatNumber',
            'b.status',
            'fs.address as pickup',
            'ts.address as dropoff',
            'b.bookingType',
            'b.totalAmount',
        ])
        .orderBy('seat.seatNumber')
        .limit(limit + 1)
        .execute()
}

export async function countUncheckedActivePassengersByTripId(
    tripId: OperationTripId,
    trx?: Transaction<Database>
) {
    const result = await (trx ?? db)
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .select(sql<number>`count(*)::int`.as('total'))
        .where(eb =>
            eb.and([
                eb('t.tripId', '=', tripId),
                eb('b.status', 'in', [PaymentStatus.enum.pending, PaymentStatus.enum.success]),
            ])
        )
        .executeTakeFirstOrThrow()

    return result.total
}

export async function findAllSupport(q: TicketSupportFilter, companyId: OrganizationBusCompanyId) {
    const { limit, next, status, type, code } = q

    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as tsp', 'tsp.id', 'trip.scheduleId')
        .where(eb => {
            const cond = []
            cond.push(eb('tsp.companyId', '=', companyId))
            if (status) {
                cond.push(eb('b.status', '=', status))
            }
            if (code) {
                cond.push(eb('b.code', '=', code))
            }

            if (type) {
                cond.push(eb('b.bookingType', '=', type))
            }

            if (next) {
                cond.push(eb('t.id', '<', next))
            }

            return eb.and(cond)
        })
        .select(eb => [
            't.id',
            'b.code',
            'b.bookingType',
            'b.originalAmount',
            'b.discountAmount',
            'b.totalAmount',
            'trip.id as tripId',
            'trip.status as tripStatus',
            'b.id as bookingId',
            'b.status',
            'trip.departureDate',
            'b.expiredAt',
            eb
                .exists(
                    eb
                        .selectFrom('organization.bus_company_review as r')
                        .select('r.id')
                        .whereRef('r.ticketId', '=', 't.id')
                )
                .$castTo<boolean>()
                .as('isRated'),
        ])
        .orderBy('t.id', 'desc')
        .limit(limit + 1)
        .execute()
}

export async function findByIdSupport(id: BookingTicketId, companyId: OrganizationBusCompanyId) {
    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as tsp', 'tsp.id', 'trip.scheduleId')
        .where(eb => {
            const cond = []
            cond.push(eb('tsp.companyId', '=', companyId))
            cond.push(eb('t.id', '=', id))
            return eb.and(cond)
        })
        .select(eb => [
            't.id',
            'b.code',
            'b.bookingType',
            'b.originalAmount',
            'b.discountAmount',
            'b.totalAmount',
            'b.status',
            'trip.departureDate',
            eb
                .exists(
                    eb
                        .selectFrom('organization.bus_company_review as r')
                        .select('r.id')
                        .whereRef('r.ticketId', '=', 't.id')
                )
                .$castTo<boolean>()
                .as('isRated'),
        ])
        .executeTakeFirstOrThrow()
}
