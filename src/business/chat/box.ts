import { WsClient } from '../../app/index.js'

import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { ChatBoxBody } from '../../model/body/chat/index.js'

export async function createBox(params: { token: string; userId: AuthUserId; body: ChatBoxBody }) {
    const { token, userId, body } = params
    const client = WsClient.client({ token, userId })
    if (!client) throw new Error('Socket URL or token invalid')

    const result = await dal.chat.box.cmd.createOne({
        body,
        createdBy: userId,
    })

    client.emit('chat:new', {
        boxId: result.boxId,
        title: result.title,
        userIds: result.userIds,
        body: result.body,
        createdAt: result.createdAt,
    })

    client.emit("chat:join", {
        boxId: result.boxId,
    })

    return {
        message: 'OK',
    }
}
