import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { BookingTicketId, BookingTicketStatus } from './type.js'
import { OrganizationSeatId } from '../../organization/seat/type.js'
import { OperationStationId } from '../../operation/station/type.js'
import { BookingId } from '../booking/type.js'
import { OperationTripId } from '../../operation/trip/type.js'

export interface BookingTicketTable extends Timestamps {
    id: GeneratedAlways<BookingTicketId>
    bookingId: BookingId
    tripId: OperationTripId
    seatId: OrganizationSeatId
    fromStationId: OperationStationId
    toStationId: OperationStationId
    status: BookingTicketStatus
}

export type BookingTicketTableInsert = Insertable<BookingTicketTable>
export type BookingTicketTableSelect = Selectable<BookingTicketTable>
export type BookingTicketTableUpdate = Updateable<BookingTicketTable>
