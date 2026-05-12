import { sql } from 'kysely'
import { BookingStatus } from '../../database/booking/booking/type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { utils } from '../../utils/index.js'
import { OperationTripStatus } from '../../database/operation/trip/type.js'
import { PaymentMethod, PaymentStatus } from '../../database/payment/payment/type.js'
import { db } from '../../datasource/db.js'

export async function departureReminder() {
    const today = utils.time.getTodayCalendarDateString()

    const candidates = await db
        .selectFrom('booking.booking as b')
        .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as ts', 'ts.id', 'trip.scheduleId')
        .innerJoin('auth.user as u', 'u.id', 'b.userId')
        .select([
            'u.id as userId',
            'u.email as email',
            'u.fullName as fullName',
            'b.id as bookingId',
            'b.code as bookingCode',
            'trip.id as tripId',
            'trip.departureDate as departureDate',
            'ts.departureTime as departureTime',
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
        .where(sql<boolean>`trip.departure_date = ${today}::date`)
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
            'ts.departureTime',
        ])
        .limit(100)
        .execute()

    if (candidates.length === 0)
        return {
            message: 'OK',
        }

    await db
        .insertInto('auth.notification')
        .values(
            candidates.map(item => {
                const departureDateDisplay = utils.time.formatCalendarDate(
                    new Date(item.departureDate)
                )
                return {
                    userId: item.userId as never,
                    title: 'Trip departure today',
                    body: `Your trip departs at ${item.departureTime} on ${departureDateDisplay}.`,
                    isRead: false,
                    data: `departure-reminder:${item.bookingId}:${item.tripId}`,
                }
            })
        )
        .execute()

    // if (candidates.length > 0) {
    //     console.log('send email to customers')
    //     await service.email.sender.sendMany({
    //         to: candidates.map(item => item.email),
    //         subject: 'Reminder: Trip departs today',
    //         html: service.email.template.departureReminderTemplate(),
    //     })
    // }
    return {
        message: 'OK',
    }
}
