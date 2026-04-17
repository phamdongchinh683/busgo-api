import { dal } from '../../database/index.js'
import { UserInfo } from '../../model/common.js'
import _ from 'lodash'
import { AuthUserId } from '../../database/auth/user/type.js'
import { AuthStaffProfileTableUpdate } from '../../database/auth/staff_profile/table.js'
import { AuthProfileQuery } from '../../model/query/staff/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { AuthStaffProfileRole } from '../../database/auth/staff_profile/type.js'
import { ProfileUpdateBody } from '../../model/body/profile/index.js'
import { service } from '../../service/index.js'
import { HttpErr } from '../../app/index.js'

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

export async function getProfileAccount(userInfo: UserInfo) {
    const user = await dal.auth.user.query.getOne({ id: userInfo.id })
    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    let accountStripeId = user?.accountStripeId
    if (!accountStripeId) {
        const account = await service.stripe.connect.createConnectAccount({
            email: user.email,
            metadata: {},
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
