import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { ChatBoxId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface ChatBoxTable extends Timestamps {
    id: GeneratedAlways<ChatBoxId>
    userIds: string
    title: string | null
    createdBy: AuthUserId
}

export type ChatBoxTableInsert = Insertable<ChatBoxTable>
export type ChatBoxTableSelect = Selectable<ChatBoxTable>
export type ChatBoxTableUpdate = Updateable<ChatBoxTable>
