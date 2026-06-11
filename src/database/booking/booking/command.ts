import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { BookingRequest } from '../../../model/body/booking/index.js'
import { utils } from '../../../utils/index.js'
import { BookingId, BookingStatus, BookingType } from './type.js'
import { BookingTicketStatus } from '../ticket/type.js'
import { Database } from '../../../datasource/type.js'
import { Transaction } from 'kysely'
import { BookingTableInsert } from './table.js'
import { dal } from '../../index.js'
import { AuthUserId } from '../../auth/user/type.js'
import { HttpErr } from '../../../app/index.js'

export async function createOneWayBooking(params: BookingRequest, userId: AuthUserId) {
    const { couponId, outBound } = params

    return db.transaction().execute(async tx => {
        const { originalAmount, discountAmount, totalAmount } =
            await dal.booking.coupon.cmd.resultAmountOneWay(outBound, tx, couponId)

        const booking = await createBookingTransaction(
            {
                userId: userId,
                couponId: couponId ?? null,
                code: utils.random.generateRandomNumber(20).toString(),
                bookingType: BookingType.enum.one_way,
                originalAmount,
                totalAmount: totalAmount,
                discountAmount: discountAmount,
                status: BookingStatus.enum.pending,
                expiredAt: utils.time.getNext({ milliseconds: utils.time.coolDownTime }),
            },
            tx
        )

        const ticket = await dal.booking.ticket.cmd.createTicketTransaction(
            {
                bookingId: booking.id,
                tripId: outBound.tripId,
                seatId: outBound.seatId,
                fromStationId: outBound.fromStationId,
                toStationId: outBound.toStationId,
                status: BookingTicketStatus.enum.reserved,
            },
            tx
        )

        await dal.booking.seatSegment.cmd.createSeatSegmentTransaction(
            {
                tripId: outBound.tripId,
                seatId: outBound.seatId,
                fromStationId: outBound.fromStationId,
                toStationId: outBound.toStationId,
                ticketId: ticket.id,
            },
            tx
        )

        if (couponId) {
            await dal.booking.coupon.cmd.upCountUsedQuantity(couponId, '+', tx)
        }

        return {
            id: booking.publicId,
            internalId: booking.id,
            expiredAt: booking.expiredAt,
            message: 'Vé của bạn sẽ được giữ trong 10 phút. Vui lòng chọn phương thức thanh toán.',
        }
    })
}

export async function createRoundTripBooking(params: BookingRequest, userId: AuthUserId) {
    const { couponId, outBound, returnBound } = params
    let total = 0
    let original = 0
    let discount = 0

    if (outBound && returnBound) {
        return db.transaction().execute(async tx => {
            const seatConflict = await dal.booking.seatSegment.cmd.checkSeatConflict(outBound, tx)
            if (seatConflict) {
                throw new HttpErr.UnprocessableEntity(
                    'Ghế đã được giữ hoặc đã được đặt.',
                    'SEAT_CONFLICT_OUTBOUND'
                )
            }

            const seatConflictReturn = await dal.booking.seatSegment.cmd.checkSeatConflict(
                returnBound,
                tx
            )
            if (seatConflictReturn) {
                throw new HttpErr.UnprocessableEntity(
                    'Ghế đã được giữ hoặc đã được đặt.',
                    'SEAT_CONFLICT_RETURNBOUND'
                )
            }

            for (const trip of [outBound, returnBound]) {
                const result = await dal.operation.tripPriceTemplate.cmd.getPriceByCompanyId(
                    {
                        companyId: trip.companyId,
                        fromStationId: trip.fromStationId,
                        toStationId: trip.toStationId,
                    },
                    tx
                )
                if (!result) {
                    throw new HttpErr.NotFound(
                        'Không tìm thấy giá chuyến đi cho chặng đã chọn.',
                        {
                            companyId: trip.companyId,
                            fromStationId: trip.fromStationId,
                            toStationId: trip.toStationId,
                        },
                        'TRIP_PRICE_NOT_FOUND'
                    )
                }
                total += result.price
            }

            if (couponId) {
                const { originalAmount, discountAmount, totalAmount } =
                    await dal.booking.coupon.cmd.resultAmountRoundTrip(total, tx, couponId)
                original += originalAmount
                discount += discountAmount
                total = totalAmount
            }

            const booking = await createBookingTransaction(
                {
                    userId,
                    couponId: couponId ?? null,
                    code: utils.random.generateRandomNumber(20).toString(),
                    bookingType: BookingType.enum.round_trip,
                    totalAmount: total,
                    discountAmount: discount,
                    originalAmount: original,
                    status: BookingStatus.enum.pending,
                    expiredAt: utils.time.getNext({ milliseconds: utils.time.coolDownTime }),
                },
                tx
            )

            const ticket = await dal.booking.ticket.cmd.insertManyTicketsTransaction(
                [
                    {
                        bookingId: booking.id,
                        tripId: outBound.tripId,
                        seatId: outBound.seatId,
                        fromStationId: outBound.fromStationId,
                        toStationId: outBound.toStationId,
                        status: BookingTicketStatus.enum.reserved,
                    },
                    {
                        bookingId: booking.id,
                        tripId: returnBound.tripId,
                        seatId: returnBound.seatId,
                        fromStationId: returnBound.fromStationId,
                        toStationId: returnBound.toStationId,
                        status: BookingTicketStatus.enum.reserved,
                    },
                ],
                tx
            )

            await dal.booking.seatSegment.cmd.insertManySeatSegmentsTransaction(
                [
                    {
                        tripId: outBound.tripId,
                        seatId: outBound.seatId,
                        fromStationId: outBound.fromStationId,
                        toStationId: outBound.toStationId,
                        ticketId: ticket[0].id,
                    },
                    {
                        tripId: returnBound.tripId,
                        seatId: returnBound.seatId,
                        fromStationId: returnBound.fromStationId,
                        toStationId: returnBound.toStationId,
                        ticketId: ticket[1].id,
                    },
                ],
                tx
            )

            if (couponId) {
                await dal.booking.coupon.cmd.upCountUsedQuantity(couponId, '+', tx)
            }

            return {
                id: booking.publicId,
                internalId: booking.id,
                expiredAt: booking.expiredAt,
                message:
                    'Vé của bạn sẽ được giữ trong 10 phút. Vui lòng chọn phương thức thanh toán.',
            }
        })
    }
}

async function createBookingTransaction(params: BookingTableInsert, trx: Transaction<Database>) {
    const data = _.omitBy(params, v => _.isNil(v)) as BookingTableInsert

    return trx.insertInto('booking.booking').values(data).returningAll().executeTakeFirstOrThrow()
}

export async function updateBookingStatus(
    bookingId: BookingId,
    status: BookingStatus,
    trx: Transaction<Database>
) {
    const booking = await trx
        .selectFrom('booking.booking as b')
        .select(['b.status', 'b.couponId'])
        .where('b.id', '=', bookingId)
        .forUpdate('b')
        .executeTakeFirstOrThrow()

    const updatedBooking = await trx
        .updateTable('booking.booking')
        .set({ status })
        .returning('booking.booking.couponId')
        .where('id', '=', bookingId)
        .execute()

    if (
        booking.status === BookingStatus.enum.pending &&
        (status === BookingStatus.enum.cancelled || status === BookingStatus.enum.expired) &&
        booking.couponId !== null
    ) {
        await dal.booking.coupon.cmd.upCountUsedQuantity(booking.couponId, '-', trx)
    }

    return updatedBooking
}

export async function updateExpiredBooking(id: BookingId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .updateTable('booking.booking')
        .set({ expiredAt: null })
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
}
