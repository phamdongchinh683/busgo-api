import { AuthUserTableInsert, AuthUserTableUpdate } from './table.js'
import { dal } from '../../index.js'
import { HttpErr } from '../../../app/index.js'
import { DatabaseError } from 'pg'
import { generateToken } from '../../../app/jwt/auth/handler.js'
import { db } from '../../../datasource/db.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { AuthStaffProfileRole } from '../staff_profile/type.js'
import { AuthCompanyAdminSignUpBody } from '../../../model/body/auth/index.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { utils } from '../../../utils/index.js'
import { service } from '../../../service/index.js'

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
                    fullName: params.fullName,
                    password: params.password,
                    phone,
                    email,
                    status: AuthUserStatus.enum.inactive,
                    role: AuthUserRole.enum.operator,
                },
                trx
            )

            await dal.auth.staffProfile.cmd.upsertOne(
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
            )

            return newUser
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
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

    const notification = await dal.auth.notification.cmd.insertOne({
        userId: userDevice[0].userId,
        title: `Hiện tại có yêu cầu tạo tài khoản mới của ${params.fullName}`,
        body: 'Vui lòng xác nhận tài khoản để truy cập vào ứng dụng.',
        data: JSON.stringify({
            userNewAccountId: user.id.toString(),
        }),
        isRead: false,
    })
    await service.firebase.fcm.sendFcm({
        fcmTokens: userDevice.map(device => device.fcmToken),
        title: `Hiện tại có yêu cầu tạo tài khoản mới của ${params.fullName}`,
        body: 'Vui lòng xác nhận tài khoản để truy cập vào ứng dụng.',
        data: {
            userNewAccountId: user.id.toString(),
            id: notification.id.toString(),
        },
    })

    return {
        message: 'Yêu cầu tạo tài khoản mới đã được gửi đến quản trị viên cấp cao',
    }
}

export async function createCompanyAccount(
    params: AuthCompanyAdminSignUpBody,
    staffRole: AuthStaffProfileRole,
    companyId: OrganizationBusCompanyId
) {
    const { phone, email } = utils.common.parseContactInfo(params.contactInfo)

    const user = await db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const newUser = await dal.auth.user.cmd.insertOne(
                {
                    fullName: params.fullName,
                    password: utils.password.hashPassword(params.password),
                    phone: phone,
                    email: email,
                    status: AuthUserStatus.enum.active,
                    role: AuthUserRole.enum.operator,
                },
                trx
            )
            await dal.auth.staffProfile.cmd.upsertOne(
                {
                    userId: newUser.id,
                    role: staffRole,
                    companyId,
                    status: AuthUserStatus.enum.active,
                    staffCode: utils.random.generateRandomNumber(6).toString(),
                    position: '',
                    department: '',
                    identityNumber: '',
                    hireDate: utils.time.getNow().toDate(),
                },
                trx
            )

            await dal.auth.notification.cmd.insertOne(
                {
                    userId: newUser.id,
                    title: 'Chào mừng bạn đến với ứng dụng',
                    body: 'Tài khoản của bạn đã được tạo bởi quản trị viên cấp cao',
                    isRead: false,
                },
                trx
            )

            return newUser
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
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
        message: 'OK',
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
                    fullName: params.fullName,
                    password: utils.password.hashPassword(params.password),
                    phone: phone,
                    email: email,
                    status: AuthUserStatus.enum.inactive,
                    role: AuthUserRole.enum.operator,
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
                title: `Hiện tại có yêu cầu tạo tài khoản mới từ công ty bạn ${params.fullName}`,
                body: 'Vui lòng xác nhận tài khoản để truy cập vào ứng dụng.',
                isRead: false,
                data: JSON.stringify({
                    userNewAccountId: newUser.id.toString(),
                }),
            })

            return newUser
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
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
        message: 'Yêu cầu tạo tài khoản mới đã được gửi đến quản trị viên công ty',
    }
}

export async function updateOne(
    userId: AuthUserId,
    params: AuthUserTableUpdate,
    trx?: Transaction<Database>
) {
    const user = await (trx ?? db)
        .updateTable('auth.user')
        .set(params)
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()

    if (params.tokenVersion !== undefined) {
        await utils.cache.delCache(`auth:token-version:${userId}`)
    }

    return user
}

export async function updatePassword(params: {
    password: string
    userId?: AuthUserId
    email?: string
    phone?: string
}) {
    const { password, userId, email, phone } = params
    const hashPassword = utils.password.hashPassword(password)
    return db
        .updateTable('auth.user')
        .set({ password: hashPassword })
        .where(eb => {
            const cond = []
            if (userId) cond.push(eb('id', '=', userId))
            if (email) cond.push(eb('email', '=', email))
            if (phone) cond.push(eb('phone', '=', phone))
            return eb.and(cond)
        })
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function incrementTokenVersion(userId: AuthUserId, trx?: Transaction<Database>) {
    const user = await (trx ?? db)
        .updateTable('auth.user')
        .set({
            tokenVersion: sql<number>`token_version + 1`,
        })
        .where('id', '=', userId)
        .returning(['id'])
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${user.id}`)

    return user
}

export async function deleteOne(userId: AuthUserId, trx?: Transaction<Database>) {
    const user = await (trx ?? db)
        .deleteFrom('auth.user')
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${userId}`)

    return user
}

export async function insertDriver(
    params: AuthUserTableInsert,
    companyId: OrganizationBusCompanyId
) {
    return db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const user = await dal.auth.user.cmd.insertOne(params, trx)
            await dal.organization.companyDriver.cmd.insertOne({ userId: user.id, companyId }, trx)

            const companyAdmin = await dal.auth.staffProfile.cmd.getOneByCompanyId(companyId, trx)

            await dal.auth.notification.cmd.insertOne(
                {
                    userId: companyAdmin.userId,
                    title: `Hiện tại có yêu cầu tạo tài khoản cho tài xế từ công ty bạn ${params.fullName}`,
                    body: 'Vui lòng xác nhận tài khoản để truy cập vào ứng dụng.',
                    isRead: false,
                },
                trx
            )

            await dal.organization.driverMonthlyStat.cmd.upsertOne(
                {
                    driverId: user.id,
                    year: utils.time.getNow().year(),
                    month: utils.time.getNow().month() + 1,
                    completedTripCount: 0,
                    cancelledTripCount: 0,
                },
                trx
            )

            return {
                message: 'Yêu cầu tạo tài khoản cho tài xế đã được gửi đến quản trị viên công ty',
            }
        } catch (error) {
            if (error instanceof DatabaseError && error.code === '23505') {
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
        await trx
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

        await trx
            .updateTable('auth.user as u')
            .set({ status: params.status })
            .where('u.id', '=', params.id)
            .executeTakeFirstOrThrow()
    })
}

export async function authUpsertByEmail(params: { data: AuthUserTableInsert }) {
    return db
        .insertInto('auth.user')
        .values(params.data)
        .onConflict(oc =>
            oc.column('email').doUpdateSet(eb => ({
                email: params.data.email,
            }))
        )
        .returningAll()
        .executeTakeFirstOrThrow()
}
