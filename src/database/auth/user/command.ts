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
                dal.auth.staffProfile.cmd.upsertOne(
                    {
                        userId: newUser.id,
                        role: staffRole,
                        status: AuthUserStatus.enum.inactive,
                        staffCode: utils.random.generateRandomNumber(6).toString(),
                        position: '',
                        department: '',
                        identityNumber: '',
                        hireDate: utils.time.getNow().toDate(),
                        companyId: params.companyId,
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

    const userDevice = await dal.auth.userDevice.cmd.findDeviceSuperAdmin()

    await Promise.allSettled([
        dal.auth.notification.cmd.insertOne({
            userId: userDevice[0].userId,
            title: 'New Account Request For Company Admin',
            body: 'A new account request has been made for your company. Please verify the account to access the app.',
            isRead: false,
        }),
        await service.firebase.fcm.sendFcm({
            fcmTokens: userDevice.map(device => device.fcmToken),
            title: 'New Account Request',
            body: 'A new account request has been made for your company. Please verify the account to access the app.',
            data: {
                userId: user.id.toString(),
            },
        }),
    ])

    return {
        message: 'Sent request to super admin to verify your account',
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
                    status: AuthUserStatus.enum.inactive,
                    role: AuthUserRole.enum.admin,
                },
                trx
            )
            await dal.auth.staffProfile.cmd.upsertOne(
                {
                    userId: newUser.id,
                    role: staffRole,
                    companyId,
                    status: AuthUserStatus.enum.inactive,
                    staffCode: utils.random.generateRandomNumber(6).toString(),
                    position: '',
                    department: '',
                    identityNumber: '',
                    hireDate: utils.time.getNow().toDate(),
                },
                trx
            )

            const companyAdmin = await dal.auth.staffProfile.cmd.getOneByCompanyId(companyId)

            await dal.auth.notification.cmd.insertOne({
                userId: companyAdmin.userId,
                title: 'New Account Request',
                body: 'A new account request has been made for your company. Please verify the account to access the app.',
                isRead: false,
            })

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

    return {
        message: 'Sent request to company admin to verify your account',
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
            .updateTable('auth.staff_profile as sp')
            .set({ status: params.status })
            .where(eb => {
                const cond = []
                cond.push(eb('sp.userId', '=', params.id))
                if (params.companyId) {
                    cond.push(eb('sp.companyId', '=', params.companyId))
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
