import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'

export async function createOne(params: { body: ChatBoxBody; createdBy: AuthUserId }) {
    const { body, createdBy } = params

    return db.transaction().execute(async trx => {
        const box = await trx
            .insertInto('chat.box')
            .values({
                userIds: body.userIds.join(','),
                title: body.title ?? null,
                createdBy: createdBy,
                lastMessage: body.message,
            })
            .onConflict(oc => oc.columns(['userIds']).doNothing())
            .returningAll()
            .executeTakeFirstOrThrow()

        const message = await trx
            .insertInto('chat.message')
            .values({
                boxId: box.id,
                senderId: createdBy,
                body: body.message,
            })
            .returningAll()
            .executeTakeFirstOrThrow()

        await trx
            .updateTable('chat.box')
            .set({ lastMessage: message.body })
            .where('id', '=', box.id)
            .execute()

        return {
            boxId: box.id,
            title: box.title,
            userIds: box.userIds.split(',').map(Number),
            body: message.body,
            createdAt: message.createdAt,
        }
    })
}
