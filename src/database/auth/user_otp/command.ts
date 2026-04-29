import { db } from '../../../datasource/db.js'
import { Otp, Phone } from '../../../model/common.js'
import { AuthUserOtpTableInsert } from './table.js'

export async function upsertOne(params: AuthUserOtpTableInsert & { field: 'email' | 'phone' }) {
    const { field, ...data } = params

    return db
        .insertInto('auth.user_otp')
        .values(data)
        .onConflict(oc => oc.column(field).doUpdateSet(data))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getOne(params: { otp?: Otp | '55555'; email?: string; phone?: string }) {
    const { email, phone, otp } = params

    return db
        .selectFrom('auth.user_otp')
        .where(eb => {
            const cond = []
            if (email) cond.push(eb('email', '=', email))
            if (phone) cond.push(eb('phone', '=', phone))
            if (otp) cond.push(eb('otp', '=', otp))
            return eb.and(cond)
        })
        .select(['otp', 'expiresAt'])
        .executeTakeFirstOrThrow()
}
