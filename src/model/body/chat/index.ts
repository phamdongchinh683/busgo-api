import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'
import { Email, Phone } from '../../common.js'

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