import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'

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
