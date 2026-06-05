import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'
import { Email, Phone } from '../../common.js'
import { ChatBoxId } from '../../../database/chat/box/type.js'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { OperationTripId } from '../../../database/operation/trip/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import {
    OrganizationSeatId,
    OrganizationSeatType,
} from '../../../database/organization/seat/type.js'
import { BookingCouponId } from '../../../database/booking/coupon/type.js'
import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import { BookingId } from '../../../database/booking/booking/type.js'

export const ChatBoxBody = z.object({
    message: z.string(),
    receiverId: AuthUserId,
})

export type ChatBoxBody = z.infer<typeof ChatBoxBody>

export const ChatMessageBody = z.object({
    message: z.string(),
})

export type ChatMessageBody = z.infer<typeof ChatMessageBody>

export const AiChatMessage = z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().trim().min(1),
})

export type AiChatMessage = z.infer<typeof AiChatMessage>

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

export const AiChatScheduleOption = z.object({
    scheduleId: OperationTripScheduleId,
    companyId: OrganizationBusCompanyId,
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
    companyId: OrganizationBusCompanyId.optional(),
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

export const AiChatBody = z.object({
    message: z.string().trim().min(1),
    state: AiChatState.optional(),
})

export type AiChatBody = z.infer<typeof AiChatBody>

export const AiChatResponse = z.object({
    message: z.string(),
    state: AiChatState.optional(),
})

export type AiChatResponse = z.infer<typeof AiChatResponse>

const AI_TRAINING_TEXT_MAX_CHARACTERS = 20_000
const AiTrainingTextContent = z
    .string()
    .min(1)
    .max(AI_TRAINING_TEXT_MAX_CHARACTERS)
    .refine(value => value.trim().length > 0, {
        message: 'Training text không được rỗng.',
    })

export const AiTrainingTextUploadBody = z.union([
    AiTrainingTextContent,
    z.object({
        fileName: z.string().trim().max(120).optional(),
        content: AiTrainingTextContent,
    }),
])

export type AiTrainingTextUploadBody = z.infer<typeof AiTrainingTextUploadBody>

export const AiTrainingTextResponse = z.object({
    message: z.string(),
    fileName: z.string(),
    characters: z.number().int().nonnegative(),
    bytes: z.number().int().nonnegative(),
    updatedAt: z.date(),
})

export type AiTrainingTextResponse = z.infer<typeof AiTrainingTextResponse>

export const AiTrainingTextStatusResponse = z.object({
    exists: z.boolean(),
    fileName: z.string(),
    content: z.string(),
    characters: z.number().int().nonnegative(),
    bytes: z.number().int().nonnegative(),
    updatedAt: z.date().nullable(),
})

export type AiTrainingTextStatusResponse = z.infer<typeof AiTrainingTextStatusResponse>

export const ChatMessageResponse = z.object({
    messages: z.array(
        z.object({
            id: ChatMessageId,
            message: z.string(),
            senderId: AuthUserId,
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
            id: ChatBoxId,
            lastMessage: z.string().nullable(),
            senderId: AuthUserId.nullable(),
            receiverId: AuthUserId.nullable(),
            senderMessageCount: z.number().int().nonnegative(),
            receiverMessageCount: z.number().int().nonnegative(),
            unreadReceiverCount: z.number().int().nonnegative(),
            unreadSenderCount: z.number().int().nonnegative(),
            lastMessageSenderId: AuthUserId.nullable(),
            displayName: z.string().nullable(),
        })
    ),
    next: ChatBoxId.nullable(),
})

export type ChatBoxResponse = z.infer<typeof ChatBoxResponse>

export const MarkReadResponse = z.object({
    message: z.string(),
    boxId: ChatBoxId,
    unreadReceiverCount: z.number().int().nonnegative(),
    unreadSenderCount: z.number().int().nonnegative(),
})

export type MarkReadResponse = z.infer<typeof MarkReadResponse>
