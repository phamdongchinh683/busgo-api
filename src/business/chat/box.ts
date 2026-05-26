import { ws } from '../../app/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { ChatBoxId } from '../../database/chat/box/type.js'
import { dal } from '../../database/index.js'
import { ChatBoxBody } from '../../model/body/chat/index.js'
import { ChatBoxQuery } from '../../model/query/chat/index.js'
import { utils } from '../../utils/index.js'
import { UserInfo } from '../../model/common.js'

export async function createBox(params: { userInfo: UserInfo; body: ChatBoxBody }) {
    const { userInfo, body } = params

    const result = await dal.chat.box.cmd.createOne({
        body,
        createdBy: userInfo.id,
    })

    try {
        ws.emitEvent({
            targetId: String(result.receiverId),
            event: 'chat:new',
            data: {
                boxId: String(result.boxId),
                senderId: userInfo.id,
                senderName: userInfo.fullName,
                receiverId: result.receiverId,
                body: result.body,
                createdAt: result.createdAt,
            },
        })
    } catch (error) {
        console.error(error)
    }

    return {
        message: 'Thành công',
    }
}

export async function getBox(userId: AuthUserId, query: ChatBoxQuery) {
    const result = await dal.chat.box.query.findAllByUserId(query, userId)

    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        boxes: data,
        next: next,
    }
}

export async function markRead(boxId: ChatBoxId, userId: AuthUserId) {
    const row = await dal.chat.box.cmd.markRead(boxId, userId)

    return {
        message: 'Thành công',
        boxId: row.id,
        unreadReceiverCount: row.unreadReceiverCount,
        unreadSenderCount: row.unreadSenderCount,
    }
}
