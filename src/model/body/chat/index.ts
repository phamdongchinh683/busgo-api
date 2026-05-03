import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'
import { Email, Phone } from '../../common.js'
import { ChatBoxId } from '../../../database/chat/box/type.js'

export const ChatBoxBody = z.object({
    message: z.string(),
    title: z.string().optional(),
    receiverId: AuthUserId,
})

export type ChatBoxBody = z.infer<typeof ChatBoxBody>

export const ChatMessageBody = z.object({
    message: z.string(),
})

export type ChatMessageBody = z.infer<typeof ChatMessageBody>

export const ChatMessageResponse = z.object({
    messages: z.array(
        z.object({
            id: ChatMessageId,
            message: z.string(),
            senderId: AuthUserId,
            fullName: z.string(),
            phone: Phone,
            email: Email,
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
            title: z.string().nullable(),
            lastMessage: z.string().nullable(),
            senderId: AuthUserId.nullable(),
            receiverId: AuthUserId.nullable(),
            senderMessageCount: z.number().int().nonnegative(),
            receiverMessageCount: z.number().int().nonnegative(),
            unreadReceiverCount: z.number().int().nonnegative(),
            unreadSenderCount: z.number().int().nonnegative(),
            lastMessageSenderId: AuthUserId.nullable(),
            senderFullName: z.string().nullable(),
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
