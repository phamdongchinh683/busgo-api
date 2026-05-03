import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'
import { Email, Phone } from '../../common.js'
import { ChatBoxId } from '../../../database/chat/box/type.js'

export const ChatBoxBody = z.object({
    message: z.string(),
    title: z.string().optional(),
    userIds: z.array(AuthUserId),
})

export type ChatBoxBody = z.infer<typeof ChatBoxBody>

export const ChatMessageBody = z.object({
    message: z.string(),
})

export type ChatMessageBody = z.infer<typeof ChatMessageBody>

export const ChatMessageResponse = z.object({   
    messages: z.array(z.object({
        id: ChatMessageId,
        message: z.string(),
        senderId: AuthUserId,
        fullName: z.string(),
        phone: Phone,
        email: Email,
        createdAt: z.date(),
    })),
    next: ChatMessageId.nullable()
})

export type ChatMessageResponse = z.infer<typeof ChatMessageResponse>

export const ChatBoxResponse = z.object({
    boxes: z.array(
        z.object({
            id: ChatBoxId,
            title: z.string().nullable(),
            lastMessage: z.string(),
        })
    ),
    next: ChatBoxId.nullable(),
})

export type ChatBoxResponse = z.infer<typeof ChatBoxResponse>