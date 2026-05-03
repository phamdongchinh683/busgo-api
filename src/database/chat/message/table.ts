import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import type { AuthUserId } from '../../auth/user/type.js'
import type { ChatBoxId } from '../box/type.js'
import { ChatMessageId } from './type.js'

export interface ChatMessageTable extends Timestamps {
    id: GeneratedAlways<ChatMessageId>
    boxId: ChatBoxId
    senderId: AuthUserId
    body: string
}

export type ChatMessageTableInsert = Insertable<ChatMessageTable>
export type ChatMessageTableSelect = Selectable<ChatMessageTable>
export type ChatMessageTableUpdate = Updateable<ChatMessageTable>
