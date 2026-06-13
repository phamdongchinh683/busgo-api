import { z } from 'zod'

export const ChatBoxId = z.coerce.number().brand<'chat.box.id'>()
export type ChatBoxId = z.infer<typeof ChatBoxId>
