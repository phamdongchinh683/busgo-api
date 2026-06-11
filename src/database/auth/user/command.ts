import { AuthUserTableInsert, AuthUserTableUpdate } from './table.js'
import { dal } from '../../index.js'
import { HttpErr } from '../../../app/index.js'
import { DatabaseError } from 'pg'
import { generateToken } from '../../../app/jwt/auth/handler.js'
import { db } from '../../../datasource/db.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { AuthCompanyAdminSignUpBody } from '../../../model/body/auth/index.js'
import { AuthOperatorRole, AuthUserId, AuthUserStatus, OPERATOR_ROLES } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { utils } from '../../../utils/index.js'
import { service } from '../../../service/index.js'

export async function signUp(params: AuthUserTableInsert) {
    try {
        const stripeCustomer = await service.stripe.client.createCustomer({
            email: params.email,
            phone: params.phone ?? '',
            name: params.fullName,
            metadata: {
                fullName: params.fullName,
                ...(params.email ? { email: params.email } : {}),
                ...(params.phone ? { phone: params.phone } : {}),
            },
        })

        const user = await dal.auth.user.query.insertOne({
            ...params,
            accountStripeId: stripeCustomer.id,
        })

        return {
            message: 'Thành công',
            token: generateToken({ ...user, id: user.publicId }),
            user: user,
        }
    } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
            if (error.constraint === 'user_email_key')
                throw new HttpErr.UnprocessableEntity(
                    `Email ${params.email} đã được đăng ký.`,
                    'EMAIL_ALREADY_EXISTS'
                )
            if (error.constraint === 'user_phone_key')
                throw new HttpErr.UnprocessableEntity(
                    `Số điện thoại ${params.phone} đã được đăng ký.`,
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
    role: AuthOperatorRole
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
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: AuthUserStatus.enum.inactive,
                    role,
                },
                trx
            )

            await dal.organization.companyMember.cmd.upsertOne(
                {
                    userId: newUser.id,
                    staffCode: utils.random.generateRandomNumber(6).toString(),
                    position: 'Điều hành',
                    department: 'Phòng điều hành',
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
                        `Email ${email} đã được đăng ký.`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }

                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `Số điện thoại ${phone} đã được đăng ký.`,
                        'PHONE_ALREADY_EXISTS'
                    )
                }
            }

            throw error
        }
    })

    const userDevice = await dal.auth.userDevice.cmd.findDeviceSuperAdmin()

    if (userDevice.length > 0) {
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
    }

    return {
        message: 'Yêu cầu tạo tài khoản mới đã được gửi đến quản trị viên cấp cao',
    }
}

export async function signUpCompanyAdminWithCompany(
    params: AuthCompanyAdminSignUpBody,
    role: AuthOperatorRole,
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
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    status: AuthUserStatus.enum.inactive,
                    role,
                },
                trx
            )
            await dal.organization.companyMember.cmd.upsertOne(
                {
                    userId: newUser.id,
                    companyId,
                    staffCode: utils.random.generateRandomNumber(6).toString(),
                    position: 'Giám đốc',
                    department: 'Điều Hành',
                    identityNumber: '',
                    hireDate: utils.time.getNow().toDate(),
                },
                trx
            )

            const companyAdmin =
                await dal.organization.companyMember.cmd.getOneByCompanyId(companyId)

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
                        `Email ${email} đã được đăng ký.`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `Số điện thoại ${phone} đã được đăng ký.`,
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
    return updateUser(userId, params, trx)
}

export async function updateOneForStaffCompany(
    userId: AuthUserId,
    params: AuthUserTableUpdate,
    companyId: OrganizationBusCompanyId
) {
    return updateUser(userId, params, undefined, companyId)
}

async function updateUser(
    userId: AuthUserId,
    params: AuthUserTableUpdate,
    trx?: Transaction<Database>,
    companyId?: OrganizationBusCompanyId
) {
    const user = await (trx ?? db)
        .updateTable('auth.user')
        .set(params)
        .$if(params.status !== undefined && params.tokenVersion === undefined, qb =>
            qb.set({ tokenVersion: sql<number>`token_version + 1` })
        )
        .where('id', '=', userId)
        .$if(Boolean(companyId), qb => qb.where('role', 'in', OPERATOR_ROLES))
        .$if(Boolean(companyId), qb =>
            qb.where(eb =>
                eb.exists(
                    eb
                        .selectFrom('organization.company_member as cm')
                        .select('cm.id')
                        .whereRef('cm.userId', '=', 'auth.user.id')
                        .where('cm.companyId', '=', companyId!)
                )
            )
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    if (params.tokenVersion !== undefined || params.status !== undefined) {
        await utils.cache.delCache(`auth:token-version:${userId}`)
        if (user.publicId) {
            await utils.cache.delCache(`auth:token-version:${user.publicId}`)
        }
    }

    return user
}

export async function updateRole(
    userId: AuthUserId,
    role: AuthOperatorRole,
    companyId: OrganizationBusCompanyId
) {
    const user = await db
        .updateTable('auth.user as u')
        .set({
            role,
            tokenVersion: sql<number>`token_version + 1`,
        })
        .where('u.id', '=', userId)
        .where('u.role', 'in', OPERATOR_ROLES)
        .where(eb =>
            eb.exists(
                eb
                    .selectFrom('organization.company_member as cm')
                    .select('cm.id')
                    .whereRef('cm.userId', '=', 'u.id')
                    .where('cm.companyId', '=', companyId)
            )
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${userId}`)
    if (user.publicId) {
        await utils.cache.delCache(`auth:token-version:${user.publicId}`)
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
        .returning(['id', 'publicId'])
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${user.id}`)
    if (user.publicId) {
        await utils.cache.delCache(`auth:token-version:${user.publicId}`)
    }

    return user
}

export async function deleteOne(userId: AuthUserId, trx?: Transaction<Database>) {
    const user = await (trx ?? db)
        .deleteFrom('auth.user')
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${userId}`)
    if (user.publicId) {
        await utils.cache.delCache(`auth:token-version:${user.publicId}`)
    }

    return user
}

export async function insertDriver(
    params: AuthUserTableInsert,
    companyId: OrganizationBusCompanyId
) {
    return db.transaction().execute(async (trx: Transaction<Database>) => {
        try {
            const user = await dal.auth.user.cmd.insertOne(params, trx)
            await dal.organization.companyMember.cmd.upsertOne({ userId: user.id, companyId }, trx)

            const companyAdmin = await dal.organization.companyMember.cmd.getOneByCompanyId(
                companyId,
                trx
            )

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
                        `Email ${params.email} đã được đăng ký.`,
                        'EMAIL_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'user_phone_key') {
                    throw new HttpErr.UnprocessableEntity(
                        `Số điện thoại ${params.phone} đã được đăng ký.`,
                        'PHONE_ALREADY_EXISTS'
                    )
                }
                if (error.constraint === 'company_member_user_id_uidx') {
                    throw new HttpErr.UnprocessableEntity(
                        'Tài xế này đã thuộc một công ty khác.',
                        'DRIVER_ALREADY_HAS_COMPANY'
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
    const user = await db
        .updateTable('auth.user as u')
        .set({
            status: params.status,
            tokenVersion: sql<number>`token_version + 1`,
        })
        .where('u.id', '=', params.id)
        .$if(Boolean(params.companyId), qb =>
            qb.where(eb =>
                eb.exists(
                    eb
                        .selectFrom('organization.company_member as cm')
                        .select('cm.id')
                        .whereRef('cm.userId', '=', 'u.id')
                        .where('cm.companyId', '=', params.companyId!)
                )
            )
        )
        .returning(['u.id'])
        .executeTakeFirstOrThrow()

    await utils.cache.delCache(`auth:token-version:${user.id}`)

    return user
}

export async function authUpsertByEmail(params: { data: AuthUserTableInsert }) {
    const user = await db
        .insertInto('auth.user')
        .values(params.data)
        .onConflict(oc =>
            oc.column('email').doUpdateSet({
                email: params.data.email,
                googleId: sql<string | null>`COALESCE(auth.user.google_id, excluded.google_id)`,
                facebookId: sql<
                    string | null
                >`COALESCE(auth.user.facebook_id, excluded.facebook_id)`,
                fullName: sql<string>`COALESCE(auth.user.full_name, excluded.full_name)`,
                isEmailVerified: sql<boolean>`auth.user.is_email_verified OR excluded.is_email_verified`,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    return user.accountStripeId ? user : ensureAccountStripeId(user)
}

type GoogleEmailAuthUserTableInsert = AuthUserTableInsert & {
    email: string
    googleId: string
}

export async function authUpsertByGoogleEmail(params: { data: GoogleEmailAuthUserTableInsert }) {
    const user = await db
        .insertInto('auth.user')
        .values(params.data)
        .onConflict(oc =>
            oc.column('email').doUpdateSet({
                email: params.data.email,
                googleId: sql<string | null>`COALESCE(auth.user.google_id, excluded.google_id)`,
                fullName: sql<string>`COALESCE(auth.user.full_name, excluded.full_name)`,
                isEmailVerified: sql<boolean>`auth.user.is_email_verified OR excluded.is_email_verified`,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    return user.accountStripeId ? user : ensureAccountStripeId(user)
}

type FacebookEmailAuthUserTableInsert = AuthUserTableInsert & {
    email: string
    facebookId: string
}

export async function authUpsertByFacebookEmail(params: {
    data: FacebookEmailAuthUserTableInsert
}) {
    const user = await db
        .insertInto('auth.user')
        .values(params.data)
        .onConflict(oc =>
            oc.column('email').doUpdateSet({
                email: params.data.email,
                facebookId: sql<
                    string | null
                >`COALESCE(auth.user.facebook_id, excluded.facebook_id)`,
                fullName: sql<string>`COALESCE(auth.user.full_name, excluded.full_name)`,
                isEmailVerified: sql<boolean>`auth.user.is_email_verified OR excluded.is_email_verified`,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    return user.accountStripeId ? user : ensureAccountStripeId(user)
}

type FacebookIdAuthUserTableInsert = AuthUserTableInsert & {
    facebookId: string
}

export async function authUpsertByFacebookId(params: { data: FacebookIdAuthUserTableInsert }) {
    const user = await db
        .insertInto('auth.user')
        .values(params.data)
        .onConflict(oc =>
            oc.column('facebookId').doUpdateSet({
                email: sql<string | null>`COALESCE(auth.user.email, excluded.email)`,
                fullName: sql<string>`COALESCE(auth.user.full_name, excluded.full_name)`,
                isEmailVerified: sql<boolean>`auth.user.is_email_verified OR excluded.is_email_verified`,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow()

    return user.accountStripeId ? user : ensureAccountStripeId(user)
}

async function ensureAccountStripeId(user: {
    id: AuthUserId
    email: string | null
    phone: string | null
    fullName: string
    accountStripeId: string | null
}) {
    const stripeCustomer = await service.stripe.client.createCustomer({
        email: user.email,
        phone: user.phone ?? '',
        name: user.fullName || user.email || 'BusGo User',
        metadata: {
            userId: user.id.toString(),
            fullName: user.fullName,
            ...(user.email ? { email: user.email } : {}),
            ...(user.phone ? { phone: user.phone } : {}),
        },
    })

    return dal.auth.user.cmd.updateOne(user.id, {
        accountStripeId: stripeCustomer.id,
    })
}
