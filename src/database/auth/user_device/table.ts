import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { AuthUserId } from '../user/type.js'
import { AuthUserDeviceId } from './type.js'

export interface AuthUserDeviceTable extends Timestamps {
    id: GeneratedAlways<AuthUserDeviceId>
    userId: AuthUserId
    fcmToken: string
}

export type AuthUserDeviceTableInsert = Insertable<AuthUserDeviceTable>
export type AuthUserDeviceTableSelect = Selectable<AuthUserDeviceTable>
export type AuthUserDeviceTableUpdate = Updateable<AuthUserDeviceTable>
