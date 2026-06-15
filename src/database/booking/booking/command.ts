import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { BookingRequest } from '../../../model/body/booking/index.js'
import { utils } from '../../../utils/index.js'
import { BookingId, BookingType, PaymentMethod, PaymentStatus } from './type.js'

import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { BookingCouponId } from '../coupon/type.js'
import { Database } from '../../../datasource/type.js'
import { Transaction } from 'kysely'
import { BookingTableInsert } from './table.js'
import { dal } from '../../index.js'
import { AuthUserId } from '../../auth/user/type.js'
import { HttpErr } from '../../../app/index.js'
import { TicketStatus } from '../ticket/type.js'

export async function createOneWayBooking(params: BookingRequest, userId: AuthUserId) {
    const { outBound } = params

    return db.transaction().execute(async tx => {
        const { originalAmount, discountAmount, totalAmount } =
            await dal.booking.coupon.cmd.resultAmountOneWay(outBound, tx)

        const booking = await createBookingTransaction(
            {
                userId: userId,
                code: utils.random.generateRandomNumber(20).toString(),
                bookingType: BookingType.enum.one_way,
                originalAmount,
                status: PaymentStatus.enum.pending,
                companyId: outBound.companyId,
                totalAmount: totalAmount,
                discountAmount: discountAmount,
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
                isRate: false,
                status: TicketStatus.enum.active,
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

        return {
            id: booking.id,
            expiredAt: booking.expiredAt,
            message: 'Vé của bạn sẽ được giữ trong 10 phút. Vui lòng chọn phương thức thanh toán.',
        }
    })
}

export async function createRoundTripBooking(params: BookingRequest, userId: AuthUserId) {
    const { outBound, returnBound } = params
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

            const booking = await createBookingTransaction(
                {
                    userId,
                    code: utils.random.generateRandomNumber(20).toString(),
                    bookingType: BookingType.enum.round_trip,
                    totalAmount: total,
                    status: PaymentStatus.enum.pending,
                    companyId: outBound.companyId,
                    discountAmount: discount,
                    originalAmount: original,
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
                        status: TicketStatus.enum.active,
                        isRate: false,
                    },
                    {
                        bookingId: booking.id,
                        tripId: returnBound.tripId,
                        seatId: returnBound.seatId,
                        fromStationId: returnBound.fromStationId,
                        toStationId: returnBound.toStationId,
                        status: TicketStatus.enum.active,
                        isRate: false,
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

            return {
                id: booking.id,
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

export async function updateExpiredBooking(id: BookingId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .updateTable('booking.booking')
        .set({ expiredAt: null })
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
}

export async function upsertPaymentForBooking(
    bookingId: BookingId,
    params: {
        companyId?: OrganizationBusCompanyId | null
        couponId?: BookingCouponId | null
        amount?: number
        method?: PaymentMethod | null
        status?: PaymentStatus
        transactionCode: string
        paidAt?: Date | null
        payDate?: string | null
        transactionNo?: string | null
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('booking.booking')
        .set({
            companyId: params.companyId ?? undefined,
            couponId: params.couponId ?? undefined,
            totalAmount: params.amount ?? undefined,
            method: params.method ?? undefined,
            status: params.status ?? undefined,
            transactionCode: params.transactionCode,
            paidAt: params.paidAt ?? undefined,
            payDate: params.payDate ?? undefined,
            transactionNo: params.transactionNo ?? undefined,
        })
        .where('id', '=', bookingId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function upsertPayment(
    params: {
        bookingId: BookingId
        transactionCode: string
        method?: PaymentMethod | null
        status?: PaymentStatus
        amount?: number
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('booking.booking')
        .set({
            transactionCode: params.transactionCode,
            method: params.method ?? undefined,
            status: params.status ?? undefined,
            totalAmount: params.amount ?? undefined,
        })
        .where('id', '=', params.bookingId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updatePaymentStatusSuccess(
    transactionCode: string,
    transactionNo: string,
    payDate: string,
    trx: Transaction<Database>
) {
    const booking = await (trx ?? db)
        .selectFrom('booking.booking')
        .select(['id', 'couponId'])
        .where('transactionCode', '=', transactionCode)
        .executeTakeFirst()

    if (!booking) return

    await (trx ?? db)
        .updateTable('booking.booking')
        .set({
            status: PaymentStatus.enum.success,
            paidAt: utils.time.getNow().toDate(),
            payDate,
            transactionNo,
        })
        .where('id', '=', booking.id)
        .execute()

    if (booking.couponId) {
        await dal.booking.coupon.cmd.upCountUsedQuantity(booking.couponId, '+', trx)
    }
}

export async function updatePaymentStatusFailed(
    transactionCode: string,
    tx: Transaction<Database>
) {
    await (tx ?? db)
        .updateTable('booking.booking')
        .set({
            status: PaymentStatus.enum.failed,
        })
        .where('transactionCode', '=', transactionCode)
        .execute()
}

export async function updatePaymentByTransactionCode(
    transactionCode: string,
    companyId: OrganizationBusCompanyId
) {
    return db.transaction().execute(async tx => {
        const booking = await dal.booking.booking.query.getPaymentByTransactionCodeForUpdate(
            transactionCode,
            tx
        )
        if (!booking || booking.companyId !== companyId) {
            throw new HttpErr.Forbidden('Bạn không có quyền cập nhật thanh toán này.')
        }

        await dal.booking.booking.cmd.updatePaymentStatusFailed(transactionCode, tx)
        return { message: 'Thành công' }
    })
}

export async function updatePaymentStatusByBookingId(
    params: { id: BookingId; status: PaymentStatus },
    trx?: Transaction<Database>
) {
    await (trx ?? db)
        .updateTable('booking.booking')
        .set({ status: params.status })
        .where('id', '=', params.id)
        .execute()
}
