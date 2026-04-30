import cron from 'node-cron'
import { sql } from 'kysely'
import { BookingStatus } from '../../database/booking/booking/type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { utils } from '../../utils/index.js'
import { Kysely } from 'kysely'
import { Database } from '../../datasource/type.js'
import { OperationTripStatus } from '../../database/operation/trip/type.js'
import { service } from '../../service/index.js'
import { PaymentMethod, PaymentStatus } from '../../database/payment/payment/type.js'

export function notificationDepatureDate(db: Kysely<Database>) {
    cron.schedule(
        '0 12 * * *',
        async () => {
            try {
                const now = utils.time.getNow()
                const windowStart = now.toDate()
                const windowEnd = now.endOf('day').toDate()

                const formatter = new Intl.DateTimeFormat('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false,
                })

                const candidates = await db
                    .selectFrom('booking.booking as b')
                    .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
                    .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
                    .innerJoin('auth.user as u', 'u.id', 'b.userId')
                    .select([
                        'u.id as userId',
                        'u.email as email',
                        'u.fullName as fullName',
                        'b.id as bookingId',
                        'b.code as bookingCode',
                        'trip.id as tripId',
                        'trip.departureDate as departureDate',
                    ])
                    .where(eb => {
                        const isPaidBooking = eb.and([
                            eb('b.status', '=', BookingStatus.enum.paid),
                            eb('t.status', '=', BookingTicketStatus.enum.paid),
                        ])

                        const isCashPendingBooking = eb.and([
                            eb('b.status', '=', BookingStatus.enum.pending),
                            eb('t.status', '=', BookingTicketStatus.enum.reserved),
                            eb.exists(
                                eb
                                    .selectFrom('payment.payment as pp')
                                    .select('pp.id')
                                    .whereRef('pp.bookingId', '=', 'b.id')
                                    .where('pp.method', '=', PaymentMethod.enum.cash)
                                    .where('pp.status', '=', PaymentStatus.enum.pending)
                            ),
                        ])

                        return eb.or([isPaidBooking, isCashPendingBooking])
                    })
                    .where('trip.status', '=', OperationTripStatus.enum.scheduled)
                    .where('trip.departureDate', '>=', windowStart)
                    .where('trip.departureDate', '<', windowEnd)
                    .where(eb => {
                        const alreadyNotified = eb.exists(
                            eb
                                .selectFrom('auth.notification as n')
                                .select('n.id')
                                .whereRef('n.userId', '=', 'u.id')
                                .where(
                                    'n.data',
                                    '=',
                                    sql<string>`'departure-reminder:' || b.id::text || ':' || trip.id::text`
                                )
                        )

                        return eb.not(alreadyNotified)
                    })
                    .groupBy([
                        'u.id',
                        'u.email',
                        'u.fullName',
                        'b.id',
                        'b.code',
                        'trip.id',
                        'trip.departureDate',
                    ])
                    .limit(100)
                    .execute()

                console.log('candidates', candidates)
                if (candidates.length === 0) return

                await db
                    .insertInto('auth.notification')
                    .values(
                        candidates.map(item => {
                            const departureDisplay = formatter.format(new Date(item.departureDate))
                            return {
                                userId: item.userId as never,
                                title: 'Trip departure today',
                                body: `Your trip departs at ${departureDisplay}.`,
                                isRead: false,
                                data: `departure-reminder:${item.bookingId}:${item.tripId}`,
                            }
                        })
                    )
                    .execute()

                if (candidates.length > 0) {
                    console.log('send email to customers')
                    await service.email.sender.sendMany({
                        to: candidates.map(item => item.email),
                        subject: 'Reminder: Trip departs today',
                        html: service.email.template.departureReminderTemplate(),
                    })
                }
                console.log('OK')
            } catch (err) {
                console.error(err)
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    )
}
