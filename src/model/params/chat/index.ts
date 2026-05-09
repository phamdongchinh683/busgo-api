import z from 'zod'
import { ChatBoxId } from '../../../database/chat/box/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'

export const ChatBoxIdParam = z.object({
    id: ChatBoxId,
})

export type ChatBoxIdParam = z.infer<typeof ChatBoxIdParam>

export const ChatMessageIdParam = z.object({
    id: ChatBoxId,
    messageId: ChatMessageId,
})

export type ChatMessageIdParam = z.infer<typeof ChatMessageIdParam>
