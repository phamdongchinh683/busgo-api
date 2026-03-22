import { AuthUserTableInsert, AuthUserTableUpdate } from './table.js'
import { dal } from '../../index.js'
import { HttpErr } from '../../../app/index.js'
import { DatabaseError } from 'pg'
import { generateToken } from '../../../app/jwt/handler.js'
import { db } from '../../../datasource/db.js'
import { Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { AuthStaffProfileRole } from '../staff_profile/type.js'
import { AuthCompanyAdminSignUpBody } from '../../../model/body/auth/index.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { utils } from '../../../utils/index.js'

export async function signUp(params: AuthUserTableInsert) {
    try {
        const user = await dal.auth.user.query.insertOne(params)

        return {
            message: 'OK',
            token: generateToken(user),
            user: user,
        }
    } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
            if (error.constraint === 'user_username_key')
                throw new HttpErr.UnprocessableEntity(
                    `${params.username} has been registered before`,
                    'USERNAME_ALREADY_EXISTS'
                )
            if (error.constraint === 'user_email_key')
                throw new HttpErr.UnprocessableEntity(
                    `${params.email} has been registered before`,
                    'EMAIL_ALREADY_EXISTS'
                )
            if (error.constraint === 'user_phone_key')
                throw new HttpErr.UnprocessableEntity(
                    `${params.phone} has been registered before`,
                    'PHONE_ALREADY_EXISTS'
                )
        }
        throw error
    }
}

export async function insertOne(params: AuthUserTableInsert, trx?: Transaction<Database>) {
    return (trx ?? db)
        .insertInto('auth.user')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function signUpCompanyAdmin(
    params: AuthCompanyAdminSignUpBody,
    staffRole: AuthStaffProfileRole
) {
    const { phone, email } = utils.common.parseContactInfo(params.contactInfo)

    return await db.transaction().execute(async (trx: Transaction<Database>) => {
        let user
        try {
            user = await dal.auth.user.cmd.insertOne(
                {
                    username: params.username,
                    fullName: params.fullName,
                    password: params.password,
                    phone: phone,
                    email: email,
                    status: AuthUserStatus.enum.inactive,
                    role: AuthUserRole.enum.admin,
                },
                trx
            )
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
                if (error.constraint === 'user_username_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${params.username} has been registered before`,
                        'USERNAME_ALREADY_EXISTS'
                    )
                }

                if (error.constraint === 'user_email_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${email} has been registered before`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }

                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${phone} has been registered before`,
                        'PHONE_ALREADY_EXISTS'
                    )
                }
            }

            throw error
        }

        await dal.auth.staffProfile.cmd.upsertOne({ userId: user.id, role: staffRole }, trx)

        await dal.auth.staffDetail.cmd.upsertOne(
            {
                userId: user.id,
                phone: phone,
                email: email,
                status: AuthUserStatus.enum.inactive,
                companyId: params.companyId ?? null,
            },
            trx
        )

        return {
            message:
                staffRole === AuthStaffProfileRole.enum.super_admin
                    ? 'Please contact the business to activate your account'
                    : 'Please contact the administrator to activate your account',
            user: user,
        }
    })
}

export async function signUpCompanyAdminWithCompany(
    params: AuthCompanyAdminSignUpBody,
    staffRole: AuthStaffProfileRole,
    companyId: OrganizationBusCompanyId
) {
    const { phone, email } = utils.common.parseContactInfo(params.contactInfo)

    return await db.transaction().execute(async (trx: Transaction<Database>) => {
        let user
        try {
            user = await dal.auth.user.cmd.insertOne(
                {
                    username: params.username,
                    fullName: params.fullName,
                    password: utils.password.hashPassword(params.password),
                    phone: phone,
                    email: email,
                    status: AuthUserStatus.enum.active,
                    role: AuthUserRole.enum.admin,
                },
                trx
            )
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
                if (error.constraint === 'user_username_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${params.username} has been registered before`,
                        'USERNAME_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'user_email_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${email} has been registered before`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${phone} has been registered before`,
                        'PHONE_ALREADY_EXISTS'
                    )
                }
            }
            throw error
        }

        await dal.auth.staffProfile.cmd.upsertOne({ userId: user.id, role: staffRole }, trx)
        await dal.auth.staffDetail.cmd.upsertOne(
            {
                userId: user.id,
                companyId,
                phone,
                email,
                status: AuthUserStatus.enum.active,
            },
            trx
        )

        return {
            message: 'OK',
            user,
        }
    })
}

export async function updateOne(userId: AuthUserId, params: AuthUserTableUpdate) {
    return db
        .updateTable('auth.user')
        .set(params)
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updatePassword(userId: AuthUserId, password: string) {
    return db
        .updateTable('auth.user')
        .set({ password: utils.password.hashPassword(password) })
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function deleteOne(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .deleteFrom('auth.user')
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}
