import { dal } from '../../database/index.js'
import { ChatBoxId } from '../../database/chat/box/type.js'
import { ChatMessageQuery } from '../../model/query/chat/index.js'
import { utils } from '../../utils/index.js'
import { UserInfo } from '../../model/common.js'
import { ws } from '../../app/index.js'
export async function sendMessage(
    params: {
        userInfo: UserInfo
    },
    body: {
        message: string
        boxId: ChatBoxId
    }
) {
    const { userInfo } = params
    const { message, boxId } = body

    const result = await dal.chat.message.cmd.insertOne({
        boxId: boxId,
        senderId: userInfo.id,
        body: message,
    })
    const receiverId =
        result.box.receiverId === userInfo.id ? result.box.senderId : result.box.receiverId

    ws.emitEvent({
        targetId: String(result.box.id),
        event: 'message:new',
        data: {
            boxId: String(result.box.id),
            senderName: userInfo.fullName,
            body: result.row.body,
            senderId: result.row.senderId,
            receiverId: receiverId,
            createdAt: result.row.createdAt,
        },
    })

    ws.emitEvent({
        targetId: String(receiverId),
        event: 'chat:unread:count',
        data: {
            boxId: String(result.box.id),
            lastMessage: result.row.body,
            unreadReceiverCount: result.box.unreadReceiverCount,
            unreadSenderCount: result.box.unreadSenderCount,
        },
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
