import z from 'zod'
import { ChatBoxId } from '../../../database/chat/box/type.js'

export const ChatBoxIdParam = z.object({
    id: ChatBoxId,
})

export type ChatBoxIdParam = z.infer<typeof ChatBoxIdParam>
