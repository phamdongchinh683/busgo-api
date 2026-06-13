import { z } from 'zod'

export const ChatMessageId = z.coerce.number().brand<'chat.message.id'>()
export type ChatMessageId = z.infer<typeof ChatMessageId>
