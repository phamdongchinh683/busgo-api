import { AuthUserTableInsert, AuthUserTableUpdate } from './table.js'
import { dal } from '../../index.js'
import { HttpErr } from '../../../app/index.js'
import { DatabaseError } from 'pg'
import { generateToken } from '../../../app/jwt/handler.js'
import { db } from '../../../datasource/db.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { AuthStaffProfileRole } from '../staff_profile/type.js'
import { AuthCompanyAdminSignUpBody } from '../../../model/body/auth/index.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { utils } from '../../../utils/index.js'
import { service } from '../../../service/index.js'
import { eq } from 'lodash'

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

    const user = await db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const newUser = await dal.auth.user.cmd.insertOne(
                {
                    username: params.username,
                    fullName: params.fullName,
                    password: params.password,
                    phone,
                    email,
                    status: AuthUserStatus.enum.inactive,
                    role: AuthUserRole.enum.admin,
                },
                trx
            )

            await Promise.all([
                dal.auth.staffProfile.cmd.upsertOne({ userId: newUser.id, role: staffRole }, trx),
                dal.auth.staffDetail.cmd.upsertOne(
                    {
                        userId: newUser.id,
                        phone,
                        email,
                        status: AuthUserStatus.enum.inactive,
                        companyId: params.companyId ?? null,
                    },
                    trx
                ),
            ])

            return newUser
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
    })

    service.email.sender.sendMail({
        subject: 'Verify Account',
        text: 'Please verify account to access the app',
        html: service.email.template.emailRequestAccess({
            id: user.id,
            fullName: user.fullName,
        }),
    })

    return {
        message: 'Sent email to business to activate your account',
    }
}

export async function signUpCompanyAdminWithCompany(
    params: AuthCompanyAdminSignUpBody,
    staffRole: AuthStaffProfileRole,
    companyId: OrganizationBusCompanyId
) {
    const { phone, email } = utils.common.parseContactInfo(params.contactInfo)

    const user = await db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const newUser = await dal.auth.user.cmd.insertOne(
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

            await Promise.all([
                dal.auth.staffProfile.cmd.upsertOne({ userId: newUser.id, role: staffRole }, trx),
                dal.auth.staffDetail.cmd.upsertOne(
                    {
                        userId: newUser.id,
                        companyId,
                        phone,
                        email,
                        status: AuthUserStatus.enum.active,
                    },
                    trx
                ),
            ])

            return newUser
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
    })

    const companyAdmin = await dal.auth.staffDetail.cmd.getOneByCompanyId(params.companyId)

    console.log(companyAdmin)
    service.email.sender.sendMail({
        to: companyAdmin.email,
        subject: 'Verify Account',
        text: 'Verify account to access the app',
        html: service.email.template.emailRequestAccess({
            id: user.id,
            fullName: user.fullName,
        }),
    })
    return {
        message: 'Sent email to company admin to activate your account',
    }
}

export async function updateOne(
    userId: AuthUserId,
    params: AuthUserTableUpdate,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
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

export async function insertDriver(
    params: AuthUserTableInsert,
    companyId: OrganizationBusCompanyId
) {
    return db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const user = await dal.auth.user.cmd.insertOne(params, trx)
            await dal.organization.companyDriver.cmd.insertOne(
                { userId: user.id, companyId, status: AuthUserStatus.enum.active },
                trx
            )
            return {
                message: 'OK',
                token: generateToken(user),
                user,
            }
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
                        `${params.email} has been registered before`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `${params.phone} has been registered before`,
                        'PHONE_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'company_drivers_user_id_company_id_uidx') {
                    throw new HttpErr.UnprocessableEntity(
                        'This driver is already registered for this company',
                        'DRIVER_COMPANY_ALREADY_EXISTS'
                    )
                }
            }
            throw error
        }
    })
}

export async function verify(params: {
    id: AuthUserId
    status: AuthUserStatus
    companyId?: OrganizationBusCompanyId | null
}) {
    return db.transaction().execute(async trx => {
        const result = await trx
            .updateTable('auth.staff_detail as sd')
            .set({ status: params.status })
            .where(eb => {
                const cond = []
                cond.push(eb('sd.userId', '=', params.id))
                if (params.companyId) {
                    cond.push(eb('sd.companyId', '=', params.companyId))
                }
                return eb.and(cond)
            })
            .executeTakeFirstOrThrow()

        if (result.numUpdatedRows === 0n) {
            throw new HttpErr.Forbidden('You cannot update this account from another company.')
        }

        await trx
            .updateTable('auth.user as u')
            .set({ status: params.status })
            .where('u.id', '=', params.id)
            .executeTakeFirstOrThrow()
    })
}
