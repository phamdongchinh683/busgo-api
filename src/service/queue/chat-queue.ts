import { sendMessage } from './client.js'
import type { QueueMessage } from './type.js'

type SendOptions = NonNullable<Parameters<typeof sendMessage>[2]>

export async function pushChatMessage(
    message: QueueMessage<'chat-messages'>,
    options?: SendOptions
) {
    return sendMessage('chat-messages', message, options)
}
