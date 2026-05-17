import { BookingStatus } from '../../database/booking/booking/type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { PaymentStatus } from '../../database/payment/payment/type.js'
import { utils } from '../../utils/index.js'
import { db } from '../../datasource/db.js'

export async function expireBooking() {
    const now = utils.time.getNow().toDate()

    return db.transaction().execute(async trx => {
        const expiredBookings = await trx
            .selectFrom('booking.booking as b')
            .select('b.id')
            .where('b.status', '=', BookingStatus.enum.pending)
            .where('b.expiredAt', '<', now)
            .limit(200)
            .execute()

        if (expiredBookings.length === 0) {
            return {
                message: 'OK',
                expiredBookingCount: 0,
                cancelledTicketCount: 0,
            }
        }

        const bookingIds = expiredBookings.map(b => b.id)

        const updatedBookings = await trx
            .updateTable('booking.booking as b')
            .set({
                status: BookingStatus.enum.expired,
            })
            .where('b.id', 'in', bookingIds)
            .where('b.status', '=', BookingStatus.enum.pending)
            .where('b.expiredAt', '<', now)
            .returning('b.id')
            .execute()

        const updatedBookingIds = updatedBookings.map(b => b.id)

        if (updatedBookingIds.length === 0) {
            return {
                message: 'OK',
                expiredBookingCount: 0,
                cancelledTicketCount: 0,
            }
        }

        await trx
            .updateTable('payment.payment as pp')
            .set({
                status: PaymentStatus.enum.failed,
            })
            .where('pp.bookingId', 'in', updatedBookingIds)
            .where('pp.status', '=', PaymentStatus.enum.pending)
            .execute()

        const cancelledTickets = await trx
            .updateTable('booking.ticket as t')
            .set({
                status: BookingTicketStatus.enum.cancelled,
            })
            .where('t.bookingId', 'in', updatedBookingIds)
            .where('t.status', '!=', BookingTicketStatus.enum.checked_in)
            .returning('t.id')
            .execute()

        const ticketIds = cancelledTickets.map(t => t.id)

        if (ticketIds.length > 0) {
            await trx
                .deleteFrom('booking.seat_segment as ss')
                .where('ss.ticketId', 'in', ticketIds)
                .execute()
        }

        return {
            message: 'OK',
            expiredBookingCount: updatedBookingIds.length,
            cancelledTicketCount: ticketIds.length,
        }
    })
}