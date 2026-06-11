import { z } from 'zod'

export const ChatBoxId = z.coerce.number().brand<'chat.box.id'>()
export type ChatBoxId = z.infer<typeof ChatBoxId>

export const ChatBoxPublicId = z.uuid().brand<'chat.box.public_id'>()
export type ChatBoxPublicId = z.infer<typeof ChatBoxPublicId>
