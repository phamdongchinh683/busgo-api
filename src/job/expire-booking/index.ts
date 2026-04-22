import cron from 'node-cron'
import { BookingStatus } from '../../database/booking/booking/type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { PaymentStatus } from '../../database/payment/payment/type.js'
import { utils } from '../../utils/index.js'
import { Kysely } from 'kysely'
import { Database } from '../../datasource/type.js'

export function expireBooking(db: Kysely<Database>) {
    cron.schedule(
        '* /15 * * * *',
        async () => {
            await db.transaction().execute(async trx => {
                const expiredBookings = await trx
                    .selectFrom('booking.booking as b')
                    .select('b.id')
                    .where(eb => {
                        const cond = []
                        cond.push(eb('b.status', '=', BookingStatus.enum.pending))
                        cond.push(eb('b.expiredAt', '<', utils.time.getNow().toDate()))
                        return eb.and(cond)
                    })
                    .limit(200)
                    .execute()

                if (expiredBookings.length === 0) return

                const bookingIds = expiredBookings.map(b => b.id)

                await trx
                    .updateTable('booking.booking as b')
                    .set({ status: BookingStatus.enum.expired })
                    .where('b.id', 'in', bookingIds)
                    .executeTakeFirstOrThrow()

                await trx
                    .updateTable('payment.payment as pp')
                    .set({ status: PaymentStatus.enum.failed })
                    .where('pp.bookingId', 'in', bookingIds)
                    .where('pp.status', '=', PaymentStatus.enum.pending)
                    .executeTakeFirst()

                const tickets = await trx
                    .updateTable('booking.ticket as t')
                    .set({ status: BookingTicketStatus.enum.cancelled })
                    .where(eb => {
                        const cond = []
                        cond.push(eb('t.bookingId', 'in', bookingIds))
                        cond.push(eb('t.status', '!=', BookingTicketStatus.enum.checked_in))
                        return eb.and(cond)
                    })
                    .returning('id')
                    .execute()

                const ticketIds = tickets.map(t => t.id)

                if (ticketIds.length > 0) {
                    await trx
                        .deleteFrom('booking.seat_segment as ss')
                        .where('ss.ticketId', 'in', ticketIds)
                        .executeTakeFirstOrThrow()
                }
            })
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    )
}
