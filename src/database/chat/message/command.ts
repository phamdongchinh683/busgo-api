import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { ChatMessageTableInsert } from './table.js'

export async function insertOne(params: ChatMessageTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as ChatMessageTableInsert
    return db.insertInto('chat.message').values(data).returningAll().executeTakeFirstOrThrow()
}
