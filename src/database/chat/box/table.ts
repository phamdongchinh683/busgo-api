import { ColumnType, GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { ChatBoxId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface ChatBoxTable extends Timestamps {
    id: GeneratedAlways<ChatBoxId>
    title: string | null
    senderId: AuthUserId
    receiverId: AuthUserId
    lastMessage: string
    createdBy: AuthUserId
    senderMessageCount: ColumnType<number, number | undefined, number>
    receiverMessageCount: ColumnType<number, number | undefined, number>
    unreadReceiverCount: ColumnType<number, number | undefined, number>
    unreadSenderCount: ColumnType<number, number | undefined, number>
    lastMessageSenderId: AuthUserId
}

export type ChatBoxTableInsert = Insertable<ChatBoxTable>
export type ChatBoxTableSelect = Selectable<ChatBoxTable>
export type ChatBoxTableUpdate = Updateable<ChatBoxTable>
