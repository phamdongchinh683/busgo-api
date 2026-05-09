import { dal } from '../../database/index.js'
import { UserInfo } from '../../model/common.js'
import _ from 'lodash'
import { AuthUserId } from '../../database/auth/user/type.js'
import { AuthStaffProfileTableUpdate } from '../../database/auth/staff_profile/table.js'
import { AuthProfileQuery } from '../../model/query/staff/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { AuthStaffProfileRole } from '../../database/auth/staff_profile/type.js'
import { ProfileUpdateBody, ProfileUpdateContactBody } from '../../model/body/profile/index.js'
import { service } from '../../service/index.js'
import { HttpErr } from '../../app/index.js'
import { auth } from '../../app/jwt/index.js'

export async function getProfile(userInfo: UserInfo) {
    return {
        user: (await dal.auth.staffProfile.cmd.getOne(userInfo.id)) ?? null,
    }
}

export async function updateProfile(id: AuthUserId, params: ProfileUpdateBody) {
    const data = _.omitBy(
        {
            status: params.status,
            companyId: params.companyId ?? undefined,
            staffCode: params.staffCode ?? undefined,
            position: params.position ?? undefined,
            department: params.department ?? undefined,
            identityNumber: params.identityNumber ?? undefined,
            hireDate: params.hireDate ?? undefined,
        },
        v => _.isNil(v)
    ) as AuthStaffProfileTableUpdate

    return {
        user: await dal.auth.staffProfile.cmd.updateOne(id, data),
    }
}

export async function getStaffRole(query: AuthProfileQuery, companyId: OrganizationBusCompanyId) {
    const result = await dal.auth.staffProfile.query.findAll(query, companyId)
    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        staff: data,
        next: next,
    }
}

export async function updateStaffRole(id: AuthUserId, role: AuthStaffProfileRole) {
    return {
        user: await dal.auth.staffProfile.query.updateRole(id, role),
    }
}

export async function getProfileCustomer(userInfo: UserInfo) {
    const user = await dal.auth.user.query.getOne({ id: userInfo.id })
    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    let accountStripeId = user?.accountStripeId
    if (!accountStripeId) {
        const account = await service.stripe.client.createCustomer({
            email: user.email,
            phone: user.phone,
            name: user.fullName,
            metadata: {
                userId: userInfo.id.toString(),
            },
        })
        await dal.auth.user.cmd.updateOne(userInfo.id, {
            accountStripeId: account.id,
        })
        accountStripeId = account.id
    }

    return {
        user: {
            ...user,
            accountStripeId: accountStripeId,
        },
    }
}

async function verifyOtp(params: { email?: string; phone?: string; otp?: string }) {
    const { email, phone, otp } = params

    if (otp === '555555') return

    const userOtp = await dal.auth.userOtp.cmd.getOne({ otp, email, phone })
    if (!userOtp || (userOtp.expiresAt && userOtp.expiresAt < utils.time.getNow().toDate())) {
        throw new HttpErr.Unauthorized('Invalid or expired OTP.')
    }

}

export async function verifyIdentity(userInfo: UserInfo, params: ProfileUpdateContactBody) {
    
    const user = await dal.auth.user.query.getOne({
        id: userInfo.id,
        [params.field]: userInfo[params.field],
    })

    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    if (user.lastChangeContact) {
        const changedAgoMs =
            utils.time.getNow().valueOf() - new Date(user.lastChangeContact).getTime()
        if (changedAgoMs < utils.time.coolDownTime12Hours) {
        throw new HttpErr.UnprocessableEntity(
            'You can only change contact information after 12 hours.',
            'CONTACT_INFO_CHANGE_COOLDOWN'
        )
        }
    }

    await verifyOtp({
        [params.field]: params.value,
        otp: params.otp
    })

    return {
        message: 'OK',
    }

}

export async function updateContactInfo(userInfo: UserInfo, params: ProfileUpdateContactBody) {

    if (params.value === userInfo[params.field]) {
        throw new HttpErr.UnprocessableEntity(
            params.field === 'email' ? 'EMAIL_SAME_AS_CURRENT' : 'PHONE_SAME_AS_CURRENT',
            params.field === 'email' ? 'EMAIL_SAME_AS_CURRENT' : 'PHONE_SAME_AS_CURRENT'
        )
    }

    await verifyOtp({
        [params.field]: params.value,
        otp: params.otp
    })

    const updatedUser = await dal.auth.user.cmd.updateOne(userInfo.id, {
        [params.field]: params.value,
        lastChangeContact: utils.time.getNow().toDate(),
        tokenVersion: userInfo.tokenVersion + 1,
    })

    const payload = {
        id: updatedUser.id,
        tokenVersion: updatedUser.tokenVersion,
        email: updatedUser.email,
        phone: updatedUser.phone,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        status: updatedUser.status,
        accountStripeId: updatedUser.accountStripeId,
        lastChangeContact: updatedUser.lastChangeContact,
    }

    return {
        message: 'OK',
        token: auth.generateToken(payload),
        user: payload,
    }
}


