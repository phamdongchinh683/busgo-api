import { ColumnType, GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { AuthUserOtpId } from './type.js'

export interface AuthUserOtpTable {
    id: GeneratedAlways<AuthUserOtpId>
    email: string | null
    phone: string | null
    otp: string
    expiresAt: Date | null
    createdAt: ColumnType<Date, never, never>
}

export type AuthUserOtpTableInsert = Insertable<AuthUserOtpTable>
export type AuthUserOtpTableSelect = Selectable<AuthUserOtpTable>
export type AuthUserOtpTableUpdate = Updateable<AuthUserOtpTable>
