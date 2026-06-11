import { z } from 'zod'

export const ChatMessageId = z.coerce.number().brand<'chat.message.id'>()
export type ChatMessageId = z.infer<typeof ChatMessageId>

export const ChatMessagePublicId = z.uuid().brand<'chat.message.public_id'>()
export type ChatMessagePublicId = z.infer<typeof ChatMessagePublicId>
