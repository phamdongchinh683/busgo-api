import z from 'zod'
import { AuthUserId, AuthUserPublicId } from '../../../database/auth/user/type.js'
import { ChatMessageId, ChatMessagePublicId } from '../../../database/chat/message/type.js'
import { Email, Phone } from '../../common.js'
import { ChatBoxId, ChatBoxPublicId } from '../../../database/chat/box/type.js'
import {
    OperationTripScheduleId,
    OperationTripSchedulePublicId,
} from '../../../database/operation/trip-schedule/type.js'
import { OperationTripId, OperationTripPublicId } from '../../../database/operation/trip/type.js'
import {
    OperationStationId,
    OperationStationPublicId,
} from '../../../database/operation/station/type.js'
import { OrganizationBusCompanyPublicId } from '../../../database/organization/bus_company/type.js'
import {
    OrganizationSeatId,
    OrganizationSeatPublicId,
    OrganizationSeatType,
} from '../../../database/organization/seat/type.js'
import { BookingCouponId, BookingCouponPublicId } from '../../../database/booking/coupon/type.js'
import { BookingTicketId, BookingTicketPublicId } from '../../../database/booking/ticket/type.js'
import { BookingId, BookingPublicId } from '../../../database/booking/booking/type.js'

export const ChatBoxBody = z.object({
    message: z.string(),
    receiverId: AuthUserPublicId,
})

export type ChatBoxBody = z.infer<typeof ChatBoxBody>

export const ChatMessageBody = z.object({
    message: z.string(),
})

export type ChatMessageBody = z.infer<typeof ChatMessageBody>

export const AiChatBookingStage = z.enum([
    'idle',
    'schedules_listed',
    'need_date',
    'pickup_listed',
    'dropoff_listed',
    'seat_listed',
    'coupon_prompted',
    'booking_created',
])

export type AiChatBookingStage = z.infer<typeof AiChatBookingStage>

export const AiChatAwaitingField = z.enum(['departureDate', 'from', 'to'])

export type AiChatAwaitingField = z.infer<typeof AiChatAwaitingField>

export const AiChatScheduleOption = z.object({
    scheduleId: OperationTripScheduleId,
    companyId: OrganizationBusCompanyPublicId,
    name: z.string(),
    fromLocation: z.string(),
    toLocation: z.string(),
    departureTime: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    totalStars: z.number().nullable().optional(),
})

export type AiChatScheduleOption = z.infer<typeof AiChatScheduleOption>

export const AiChatStopOption = z.object({
    stationId: OperationStationId,
    stopOrder: z.number().int().nonnegative(),
    address: z.string(),
    city: z.string(),
    price: z.number().optional(),
})

export type AiChatStopOption = z.infer<typeof AiChatStopOption>

export const AiChatSeatOption = z.object({
    seatId: OrganizationSeatId,
    seatNumber: z.string(),
    type: OrganizationSeatType,
})

export type AiChatSeatOption = z.infer<typeof AiChatSeatOption>

export const AiChatState = z.object({
    stage: AiChatBookingStage.optional(),
    awaiting: AiChatAwaitingField.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    departureDate: z.coerce.date().optional(),
    scheduleOptions: z.array(AiChatScheduleOption).optional(),
    selectedSchedule: AiChatScheduleOption.optional(),
    pickupOptions: z.array(AiChatStopOption).optional(),
    selectedPickup: AiChatStopOption.optional(),
    dropoffOptions: z.array(AiChatStopOption).optional(),
    selectedDropoff: AiChatStopOption.optional(),
    seatOptions: z.array(AiChatSeatOption).optional(),
    selectedSeat: AiChatSeatOption.optional(),
    bookingId: BookingId.optional(),
    expiredAt: z.coerce.date().optional(),
    companyId: OrganizationBusCompanyPublicId.optional(),
    couponId: BookingCouponId.optional(),
    fromStationId: OperationStationId.optional(),
    orderTotal: z.coerce.number().nonnegative().optional(),
    scheduleId: OperationTripScheduleId.optional(),
    stopOrder: z.coerce.number().int().nonnegative().optional(),
    stopOrderDropoff: z.coerce.number().int().nonnegative().optional(),
    stopOrderPickup: z.coerce.number().int().nonnegative().optional(),
    ticketId: BookingTicketId.optional(),
    tripId: OperationTripId.optional(),
})

export type AiChatState = z.infer<typeof AiChatState>

export const AiChatPublicScheduleOption = AiChatScheduleOption.extend({
    scheduleId: OperationTripSchedulePublicId,
})

export const AiChatPublicStopOption = AiChatStopOption.extend({
    stationId: OperationStationPublicId,
})

export const AiChatPublicSeatOption = AiChatSeatOption.extend({
    seatId: OrganizationSeatPublicId,
})

export const AiChatPublicState = AiChatState.extend({
    scheduleOptions: z.array(AiChatPublicScheduleOption).optional(),
    selectedSchedule: AiChatPublicScheduleOption.optional(),
    pickupOptions: z.array(AiChatPublicStopOption).optional(),
    selectedPickup: AiChatPublicStopOption.optional(),
    dropoffOptions: z.array(AiChatPublicStopOption).optional(),
    selectedDropoff: AiChatPublicStopOption.optional(),
    seatOptions: z.array(AiChatPublicSeatOption).optional(),
    selectedSeat: AiChatPublicSeatOption.optional(),
    bookingId: BookingPublicId.optional(),
    couponId: BookingCouponPublicId.optional(),
    fromStationId: OperationStationPublicId.optional(),
    scheduleId: OperationTripSchedulePublicId.optional(),
    ticketId: BookingTicketPublicId.optional(),
    tripId: OperationTripPublicId.optional(),
})

export type AiChatPublicState = z.infer<typeof AiChatPublicState>

export const AiChatBody = z.object({
    message: z.string().trim().min(1),
    state: AiChatState.optional(),
})

export type AiChatBody = z.infer<typeof AiChatBody>

export const AiChatRequestBody = AiChatBody.extend({
    state: AiChatPublicState.optional(),
})

export type AiChatRequestBody = z.infer<typeof AiChatRequestBody>

export const AiChatResponse = z.object({
    message: z.string(),
    state: AiChatState.optional(),
})

export type AiChatResponse = z.infer<typeof AiChatResponse>

export const AiChatPublicResponse = AiChatResponse.extend({
    state: AiChatPublicState.optional(),
})

export type AiChatPublicResponse = z.infer<typeof AiChatPublicResponse>

export const ChatMessageResponse = z.object({
    messages: z.array(
        z.object({
            id: ChatMessagePublicId,
            message: z.string(),
            senderId: AuthUserPublicId,
            fullName: z.string(),
            phone: Phone.nullable(),
            email: Email.nullable(),
            createdAt: z.date(),
        })
    ),
    next: ChatMessageId.nullable(),
})

export type ChatMessageResponse = z.infer<typeof ChatMessageResponse>

export const ChatBoxResponse = z.object({
    boxes: z.array(
        z.object({
            id: ChatBoxPublicId,
            lastMessage: z.string().nullable(),
            senderId: AuthUserPublicId.nullable(),
            receiverId: AuthUserPublicId.nullable(),
            senderMessageCount: z.number().int().nonnegative(),
            receiverMessageCount: z.number().int().nonnegative(),
            unreadReceiverCount: z.number().int().nonnegative(),
            unreadSenderCount: z.number().int().nonnegative(),
            lastMessageSenderId: AuthUserPublicId.nullable(),
            displayName: z.string().nullable(),
        })
    ),
    next: ChatBoxId.nullable(),
})

export type ChatBoxResponse = z.infer<typeof ChatBoxResponse>

export const MarkReadResponse = z.object({
    message: z.string(),
    boxId: ChatBoxPublicId,
    unreadReceiverCount: z.number().int().nonnegative(),
    unreadSenderCount: z.number().int().nonnegative(),
})

export type MarkReadResponse = z.infer<typeof MarkReadResponse>
