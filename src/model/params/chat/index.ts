import z from 'zod'
import { ChatBoxPublicId } from '../../../database/chat/box/type.js'
import { ChatMessagePublicId } from '../../../database/chat/message/type.js'

export const ChatBoxIdParam = z.object({
    id: ChatBoxPublicId,
})

export type ChatBoxIdParam = z.infer<typeof ChatBoxIdParam>

export const ChatMessageIdParam = z.object({
    id: ChatBoxPublicId,
    messageId: ChatMessagePublicId,
})

export type ChatMessageIdParam = z.infer<typeof ChatMessageIdParam>
