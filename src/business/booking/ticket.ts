import { BookingTicketId, TicketStatus } from '../../database/booking/ticket/type.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import {
    PassengerTicketFilter,
    TicketFilter,
    TicketSupportFilter,
} from '../../model/query/ticket/index.js'
import { HttpErr } from '../../app/index.js'
import { utils } from '../../utils/index.js'
import { OperationTripStatus, OperationTripId } from '../../database/operation/trip/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { BookingId, PaymentMethod, PaymentStatus } from '../../database/booking/booking/type.js'

export async function getTickets(q: TicketFilter, userId: AuthUserId) {
    const tickets = await dal.booking.ticket.query.findAllByUserId(q, userId)
    const { data, next } = utils.common.paginateByCursor(tickets, q.limit)

    return {
        tickets: data,
        next: next,
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

export async function updateTicket(params: { id: BookingId; status: PaymentStatus }) {
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
    const tickets = await dal.booking.ticket.query.findAllSupport(q, companyId)
    const { data, next } = utils.common.paginateByCursor(tickets, q.limit)

    return {
        tickets: data,
        next: next,
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
    departureDate: Date
    method: PaymentMethod | null
    status: PaymentStatus | null
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
    method: PaymentMethod | null
    status: PaymentStatus | null
}) {
    return params.method === PaymentMethod.enum.cash || params.status === PaymentStatus.enum.pending
}

export async function getTripPassengers(
    tripId: OperationTripId,
    driverId: AuthUserId,
    query: PassengerTicketFilter
) {
    const passengers = await dal.booking.ticket.query.findPassengersByDriverAndTripId(
        { driverId, tripId },
        query
    )
    const { data, next } = utils.common.paginateByCursor(passengers, query.limit)

    return {
        passengers: data,
        next,
    }
}

export async function updateTicketStatusForDriver(params: {
    tripId: OperationTripId
    ticketId: BookingTicketId
    driverId: AuthUserId
    status: TicketStatus
}) {
    const { tripId, ticketId, driverId, status } = params

    const ticket = await dal.booking.ticket.query.findTicketByTripAndDriver({
        ticketId,
        tripId,
        driverId,
    })

    if (!ticket) {
        throw new HttpErr.Forbidden('Vé không thuộc chuyến đi của bạn.', {}, 'TICKET_NOT_FOUND')
    }

    const now = utils.time.getNow().toDate()

    const updated = await dal.booking.ticket.cmd.updateById(ticketId, {
        status,
        checkedInAt: status === TicketStatus.enum.checked_in ? now : ticket.checkedInAt,
    })

    return {
        id: updated.id,
        status: updated.status,
        checkedInAt: updated.checkedInAt,
    }
}
