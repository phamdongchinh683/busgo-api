import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { AuthUserId} from './type.js'

export interface AuthUserTable extends Timestamps {
    id: GeneratedAlways<AuthUserId>
    password: string
    fullName: string
    email: string | null
    phone: string | null
    googleId: string | null
}

export type AuthUserTableInsert = Insertable<AuthUserTable>
export type AuthUserTableSelect = Selectable<AuthUserTable>
export type AuthUserTableUpdate = Updateable<AuthUserTable>
