import { BookingSeatSegmentTableInsert } from './table.js'
import { Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import _ from 'lodash'
import { BookingTicketId } from '../ticket/type.js'
import { db } from '../../../datasource/db.js'
import { OperationTripId } from '../../operation/trip/type.js'
import { OrganizationSeatId } from '../../organization/seat/type.js'
import { OperationStationId } from '../../operation/station/type.js'

export async function createSeatSegmentTransaction(
    params: BookingSeatSegmentTableInsert,
    trx: Transaction<Database>
) {
    return trx
        .insertInto('booking.seat_segment')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function insertManySeatSegmentsTransaction(
    params: BookingSeatSegmentTableInsert[],
    trx: Transaction<Database>
) {
    return trx.insertInto('booking.seat_segment').values(params).execute()
}

export async function deleteByTicketIds(ticketIds: BookingTicketId[], trx?: Transaction<Database>) {
    if (ticketIds.length === 0) {
        return
    }
    return (trx ?? db)
        .deleteFrom('booking.seat_segment')
        .where('ticketId', 'in', ticketIds)
        .execute()
}

export async function deleteByTicketId(ticketId: BookingTicketId, trx?: Transaction<Database>) {
    return deleteByTicketIds([ticketId], trx)
}

export async function checkSeatConflict(
    params: {
        tripId: OperationTripId
        seatId: OrganizationSeatId
        fromStationId: OperationStationId
        toStationId: OperationStationId
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('booking.seat_segment')
        .where(({ eb }) =>
            eb.and([
                eb('tripId', '=', params.tripId),
                eb('seatId', '=', params.seatId),
                eb.not(
                    eb.or([
                        eb('toStationId', '<=', params.fromStationId),
                        eb('fromStationId', '>=', params.toStationId),
                    ])
                ),
            ])
        )
        .limit(1)
        .executeTakeFirst()
}
