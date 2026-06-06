import { db } from '../../../datasource/db.js'
import { Otp } from '../../../model/common.js'
import { utils } from '../../../utils/index.js'
import { AuthUserOtpTableInsert } from './table.js'

type UserOtpField = 'email' | 'phone'

export async function upsertOne(params: AuthUserOtpTableInsert & { field: 'email' | 'phone' }) {
    const { field, ...data } = params

    return db
        .insertInto('auth.user_otp')
        .values(data)
        .onConflict(oc => oc.column(field).doUpdateSet(data))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getOne(params: { otp?: Otp; email?: string; phone?: string }) {
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
        .select(['otp', 'verified', 'expiresAt'])
        .executeTakeFirst()
}

export async function verifyOne(params: { field: UserOtpField; value: string; otp?: Otp }) {
    const query = db
        .updateTable('auth.user_otp')
        .set({ verified: true, otp: '' })
        .where(params.field, '=', params.value)

    const otpQuery = params.otp ? query.where('otp', '=', params.otp) : query

    return otpQuery
        .where('expiresAt', '>', utils.time.getNow().toDate())
        .returning(['email', 'phone', 'verified', 'expiresAt'])
        .executeTakeFirst()
}

export async function findVerified(params: { field: UserOtpField; value: string }) {
    return db
        .selectFrom('auth.user_otp')
        .select(['id'])
        .where(params.field, '=', params.value)
        .where('verified', '=', true)
        .executeTakeFirst()
}
