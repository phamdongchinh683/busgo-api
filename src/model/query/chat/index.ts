import z from 'zod'
import { ChatBoxId } from '../../../database/chat/box/type.js'
import { ChatMessageId } from '../../../database/chat/message/type.js'

export const ChatBoxQuery = z.object({
    limit: z.coerce.number().min(10).max(100).default(10),
    next: ChatBoxId.optional().nullable(),
})      

export type ChatBoxQuery = z.infer<typeof ChatBoxQuery>

export const ChatBoxResponse = z.object({
    boxes: z.array(
        z.object({
            id: ChatBoxId,
            title: z.string().nullable(),
        })
    ),
    next: ChatBoxId.nullable(),
})

export type ChatBoxResponse = z.infer<typeof ChatBoxResponse>

export const ChatMessageQuery = z.object({
    message: z.string().optional(),
    limit: z.coerce.number().min(10).max(100).default(10),
    next: ChatMessageId.optional().nullable(),
})

export type ChatMessageQuery = z.infer<typeof ChatMessageQuery>