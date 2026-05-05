import { WsClient } from '../../app/index.js'
import { dal } from '../../database/index.js'
import { ChatBoxId } from '../../database/chat/box/type.js'
import { ChatMessageQuery } from '../../model/query/chat/index.js'
import { utils } from '../../utils/index.js'
import { UserInfo } from '../../model/common.js'

export async function sendMessage(
    params: {
        token: string
        userInfo: UserInfo
    },
    body: {
        message: string
        boxId: ChatBoxId
    }
) {
    const { token, userInfo } = params
    const { message, boxId } = body
    const client = WsClient.client({ token, userId: userInfo.id })
    if (!client) throw new Error('Socket URL or token invalid')

    const result = await dal.chat.message.cmd.insertOne({
        boxId: boxId,
        senderId: userInfo.id,
        body: message,
    })

    client.emit('chat:message:send', {
        boxId: String(result.box.id),
        senderName: userInfo.fullName,
        body: result.row.body,
        senderId: result.row.senderId,
        receiverId: result.box.receiverId === userInfo.id ? result.box.senderId : result.box.receiverId,
        createdAt: result.row.createdAt,
        unreadReceiverCount: result.box.unreadReceiverCount,
        unreadSenderCount: result.box.unreadSenderCount,
    })

    return { message: 'OK' }
}

export async function getMessages(
    params: {
        boxId: ChatBoxId
    },
    query: ChatMessageQuery
) {
    const { boxId } = params

    const result = await dal.chat.message.query.findAllMessagesByBoxId({ boxId }, query)

    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        messages: data,
        next: next,
    }
}
