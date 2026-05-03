import { WsClient } from '../../app/index.js'

import { AuthUserId } from '../../database/auth/user/type.js'
import { ChatBoxId } from '../../database/chat/box/type.js';
import { dal } from '../../database/index.js'
import { ChatBoxBody } from '../../model/body/chat/index.js'
import { ChatBoxQuery } from '../../model/query/chat/index.js';
import { utils } from '../../utils/index.js';

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


export async function getBox(userId: AuthUserId, query: ChatBoxQuery) {

    const result = await dal.chat.box.query.findAllByUserId(query, userId)
    
    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        boxes: data,
        next: next,
    }
}