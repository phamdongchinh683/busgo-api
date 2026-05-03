import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { ChatMessageTableInsert } from './table.js'

export async function insertOne(params: ChatMessageTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as ChatMessageTableInsert
    return db.transaction().execute(async trx => {
        const row = await trx.insertInto('chat.message').values(data).returningAll().executeTakeFirstOrThrow()
        await trx
            .updateTable('chat.box')
            .set({ lastMessage: row.body })
            .where('id', '=', row.boxId)
            .execute()
        return row
    })
}
