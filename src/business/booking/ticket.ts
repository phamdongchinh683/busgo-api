import { BookingTicketId, BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { TicketFilter, TicketSupportFilter } from '../../model/query/ticket/index.js'
import { HttpErr } from '../../app/index.js'
import { utils } from '../../utils/index.js'
import { OperationTripId, OperationTripStatus } from '../../database/operation/trip/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { BookingStatus } from '../../database/booking/booking/type.js'
import { PaymentMethod, PaymentStatus } from '../../database/booking/booking/type.js'
import { applyTicketNaturalLanguageFilter } from './ticket-search.js'

export async function getTickets(q: TicketFilter, userId: AuthUserId) {
    const filter = applyTicketNaturalLanguageFilter(q)
    const tickets = await dal.booking.ticket.query.findAllPublic(filter, userId)
    const { data, next } = utils.common.paginateByCursor(tickets, filter.limit)

    return {
        tickets: data,
        next: next,
    }
}

export async function getTicketsInternal(q: TicketFilter, userId: AuthUserId) {
    const filter = applyTicketNaturalLanguageFilter(q)
    const tickets = await dal.booking.ticket.query.findAll(filter, userId)
    const { data, next } = utils.common.paginateByCursor(tickets, filter.limit)

    return {
        tickets: data,
        next,
    }
}

export async function detailTicket(id: BookingTicketId, userId: AuthUserId) {
    const ticket = await dal.booking.ticket.query.findById(id, userId)
    return {
        ticket: ticket,
    }
}

export async function cancelTicket(id: BookingTicketId, userId: AuthUserId) {
    const data = await dal.booking.booking.query.getBookingByUserIdAndBookingId({
        userId: userId,
        ticketId: id,
    })

    if (!data)
        throw new HttpErr.Forbidden('Bạn không thể hủy vé này vì bạn không phải chủ sở hữu vé.')

    assertTicketCanBeCancelled(data)

    const tickets = await dal.booking.ticket.cmd.cancelTicketTransaction(id)

    return {
        message: 'Thành công',
        tickets: tickets,
    }
}

export async function checkInTicket(params: {
    id: BookingTicketId
    status: BookingTicketStatus
    tripId?: OperationTripId
}) {
    const ticket = await dal.booking.ticket.cmd.updateStatusTicket(params)
    return {
        message: 'Thành công',
        ticket: ticket,
    }
}

export async function getTicketsSupport(
    q: TicketSupportFilter,
    companyId: OrganizationBusCompanyId
) {
    const filter = applyTicketNaturalLanguageFilter(q)
    const tickets = await dal.booking.ticket.query.findAllSupport(filter, companyId)
    const { data, next } = utils.common.paginateByCursor(tickets, filter.limit)

    return {
        tickets: data,
        next: next,
    }
}

export async function detailTicketSupport(
    id: BookingTicketId,
    companyId: OrganizationBusCompanyId
) {
    return {
        ticket: await dal.booking.ticket.query.findByIdSupport(id, companyId),
    }
}

export async function deleteTicket(id: BookingTicketId, companyId: OrganizationBusCompanyId) {
    const data = await dal.booking.booking.query.getBookingByTicketId(id, companyId)
    if (!data) {
        throw new HttpErr.Forbidden('Không tìm thấy vé.')
    }

    assertTicketCanBeCancelled(data)

    return {
        message: 'Thành công',
        tickets: await dal.booking.ticket.cmd.cancelTicketTransaction(id),
    }
}

function assertTicketCanBeCancelled(params: {
    bookingStatus: BookingStatus
    departureDate: Date
    paymentMethod: PaymentMethod | null
    paymentStatus: PaymentStatus | null
    tripStatus: OperationTripStatus
}) {
    if (
        params.tripStatus === OperationTripStatus.enum.running ||
        params.tripStatus === OperationTripStatus.enum.completed
    ) {
        throw new HttpErr.Forbidden(
            'Chuyến đi đang diễn ra hoặc đã hoàn thành, bạn không thể hủy vé này.'
        )
    }

    if (canCancelWithoutRefundWindow(params)) {
        return
    }

    if (
        utils.time.isOutsideCancelableWindow({
            departureDate: params.departureDate,
            now: utils.time.getNow().toDate(),
        })
    ) {
        throw new HttpErr.Forbidden('Bạn chỉ có thể hủy vé trước giờ khởi hành ít nhất 24 giờ.')
    }
}

function canCancelWithoutRefundWindow(params: {
    bookingStatus: BookingStatus
    paymentMethod: PaymentMethod | null
    paymentStatus: PaymentStatus | null
}) {
    return (
        params.paymentMethod === PaymentMethod.enum.cash ||
        params.paymentStatus === PaymentStatus.enum.pending ||
        params.bookingStatus === BookingStatus.enum.pending
    )
}
