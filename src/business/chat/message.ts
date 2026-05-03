import { WsClient } from '../../app/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { ChatBoxId } from '../../database/chat/box/type.js'
import { ChatMessageQuery } from '../../model/query/chat/index.js'
import { utils } from '../../utils/index.js'

export async function sendMessage(
    params: {
        token: string
        userId: AuthUserId
    },
    body: {
        message: string
        boxId: ChatBoxId
    }
) {
    const { token, userId } = params
    const { message, boxId } = body
    const client = WsClient.client({ token, userId })
    if (!client) throw new Error('Socket URL or token invalid')

    const result = await dal.chat.message.cmd.insertOne({
        boxId: boxId,
        senderId: userId,
        body: message,
    })

    client.emit('chat:message:send', {
        boxId: result.boxId,
        body: result.body,
        createdAt: result.createdAt,
    })

    return { message: 'OK' }
}


export async function getMessages(params: {
    boxId: ChatBoxId
}, 
query: ChatMessageQuery) {
    const {boxId } = params

    const result = await dal.chat.message.query.findAllMessagesByBoxId({ boxId }, query)

    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        messages: data,
        next: next,
    }
}