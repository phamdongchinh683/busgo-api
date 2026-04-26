import { BookingTicketId, BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { TicketFilter, TicketSupportFilter } from '../../model/query/ticket/index.js'
import { HttpErr } from '../../app/index.js'
import { utils } from '../../utils/index.js'
import { OperationTripId, OperationTripStatus } from '../../database/operation/trip/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { BookingStatus } from '../../database/booking/booking/type.js'

export async function getTickets(q: TicketFilter, userId: AuthUserId) {
    const tickets = await dal.booking.ticket.query.findAll(q, userId)
    const { data, next } = utils.common.paginateByCursor(tickets, q.limit)

    return {
        tickets: data,
        next: next,
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

    if (!data) {
        throw new HttpErr.Forbidden('You are not allowed to cancel this ticket')
    }

    if (
        data.tripStatus === OperationTripStatus.enum.running ||
        data.tripStatus === OperationTripStatus.enum.completed
    ) {
        throw new HttpErr.Forbidden('Trip running or completed you can not cancel this ticket')
    }

    if (data.status === BookingStatus.enum.paid && data.createdAt < utils.time.getNow().toDate()) {
        throw new HttpErr.Forbidden('Ticket completed you can not cancel it')
    }

    const tickets = await dal.booking.ticket.cmd.cancelTicketTransaction(id)
    
    return {
        message: 'OK',
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
        message: 'OK',
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

export async function detailTicketSupport(
    id: BookingTicketId,
    companyId: OrganizationBusCompanyId
) {
    return {
        ticket: await dal.booking.ticket.query.findByIdSupport(id, companyId),
    }
}

export async function deleteTicket(id: BookingTicketId) {
    return {
        message: 'OK',
        tickets: await dal.booking.ticket.cmd.cancelTicketTransaction(id),
    }
}
