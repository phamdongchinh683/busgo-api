import cron from 'node-cron'
import { sql } from 'kysely'
import { BookingStatus } from '../../database/booking/booking/type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { utils } from '../../utils/index.js'
import { Kysely } from 'kysely'
import { Database } from '../../datasource/type.js'
import { OperationTripStatus } from '../../database/operation/trip/type.js'
import { service } from '../../service/index.js'
import type { Email } from '../../model/common.js'

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
                    .where('b.status', '=', BookingStatus.enum.paid)
                    .where('t.status', '=', BookingTicketStatus.enum.paid)
                    .where('trip.status', '=', OperationTripStatus.enum.scheduled)
                    .where('trip.departureDate', '>=', windowStart)
                    .where('trip.departureDate', '<', windowEnd)
                    .where(eb =>
                        eb.not(
                            eb.exists(
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
                        )
                    )
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

                const uniqueEmails = [
                    ...new Set(candidates.map(item => item.email).filter(Boolean)),
                ] as Email[]
                if (uniqueEmails.length > 0) {
                    await service.email.sender.sendMany({
                        to: uniqueEmails,
                        subject: 'Reminder: Trip departs today',
                        html: service.email.template.departureReminderTemplate(),
                    })
                }
            } catch (err) {
                console.error('[cron-error]', err)
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    )
}
