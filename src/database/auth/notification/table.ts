import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { AuthUserId } from '../user/type.js'
import { AuthNotificationId, AuthNotificationPublicId } from './type.js'

export interface AuthNotificationTable extends Timestamps {
    id: GeneratedAlways<AuthNotificationId>
    publicId: GeneratedAlways<AuthNotificationPublicId>
    userId: AuthUserId
    title: string
    body: string
    isRead: boolean
    data: string | null
}

export type AuthNotificationTableInsert = Insertable<AuthNotificationTable>
export type AuthNotificationTableSelect = Selectable<AuthNotificationTable>
export type AuthNotificationTableUpdate = Updateable<AuthNotificationTable>
