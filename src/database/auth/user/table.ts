import { ColumnType, GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from './type.js'

export interface AuthUserTable extends Timestamps {
    id: GeneratedAlways<AuthUserId>
    password: string
    fullName: string
    email: string | null
    phone: string | null
    facebookId: string | null
    googleId: string | null
    role: AuthUserRole
    status: AuthUserStatus
    tokenVersion: ColumnType<number, number | undefined, number>
    accountStripeId: string | null
    isPhoneVerified: ColumnType<boolean, boolean | undefined, boolean>
    isEmailVerified: ColumnType<boolean, boolean | undefined, boolean>
    lastChangeEmail: ColumnType<Date | null, Date | null | undefined, Date | null>
    lastChangePhone: ColumnType<Date | null, Date | null | undefined, Date | null>
}

export type AuthUserTableInsert = Insertable<AuthUserTable>
export type AuthUserTableSelect = Selectable<AuthUserTable>
export type AuthUserTableUpdate = Updateable<AuthUserTable>
