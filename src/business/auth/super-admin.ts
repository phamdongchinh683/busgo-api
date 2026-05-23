import { dal } from '../../database/index.js'
import { CompanyAdminQuery } from '../../model/query/company-admin/index.js'
import { CompanyAdminCreateBody } from '../../model/body/company-admin/index.js'
import { AuthStaffProfileRole } from '../../database/auth/staff_profile/type.js'
import { utils } from '../../utils/index.js'
import { AuthUserId, AuthUserStatus } from '../../database/auth/user/type.js'
import { UserBody, UserUpdateBody } from '../../model/body/user/index.js'
import { AuthPassword } from '../../model/body/auth/index.js'
import { UserListQuery } from '../../model/body/user/index.js'
import { PeriodUserQuery } from '../../model/query/user/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

export async function getDashboard() {
    const [totalUsers, totalBookings, totalRevenue, totalCompanies] = await Promise.all([
        dal.auth.user.query.countAll(),
        dal.booking.booking.query.countAll(),
        dal.payment.payment.query.getTotalRevenue(),
        dal.organization.busCompany.query.countAll(),
    ])
    return {
        overview: {
            totalUsers,
            totalBookings,
            totalRevenue,
            totalCompanies,
        },
    }
}

export async function listCompanyAdmins(query: CompanyAdminQuery) {
    const result = await dal.auth.staffProfile.query.findAllCompanyAdmins(query)
    const { data, next } = utils.common.paginateByCursor(result, query.limit)
    return {
        admins: data,
        next,
    }
}

export async function createCompanyAdmin(body: CompanyAdminCreateBody) {
    return dal.auth.user.cmd.createCompanyAccount(
        body,
        AuthStaffProfileRole.enum.company_admin,
        body.companyId
    )
}

export async function updateOne(id: AuthUserId, body: UserUpdateBody) {
    const user = await dal.auth.user.cmd.updateOne(id, body)
    await utils.cache.delCacheByPattern('driver:list:*')

    return {
        user,
    }
}

export async function updateNewPassword(id: AuthUserId, password: AuthPassword) {
    await dal.auth.user.cmd.updatePassword({
        userId: id,
        password: password,
    })
    return {
        message: 'OK',
        password: password,
    }
}

export async function listUsers(query: UserListQuery) {
    const result = await dal.auth.user.query.findAll(query)
    const { data, next } = utils.common.paginateByCursor(result, query.limit)
    return {
        users: data,
        next,
    }
}

export async function createUser(body: UserBody) {
    return dal.auth.user.cmd.signUp({
        password: utils.password.hashPassword(body.password),
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        status: body.status,
    })
}

export async function deleteOne(id: AuthUserId) {
    const user = await dal.auth.user.cmd.deleteOne(id)
    await utils.cache.delCacheByPattern('driver:list:*')

    return {
        message: 'OK',
        user: user,
    }
}

export async function getPeriodUsers(params: PeriodUserQuery) {
    const data = await dal.auth.user.query.getPeriod(params)
    return { data: data }
}

export async function verifyAccount(params: {
    id: AuthUserId
    status: AuthUserStatus
    companyId?: OrganizationBusCompanyId | null
}) {
    await dal.auth.user.cmd.verify(params)
    await utils.cache.delCacheByPattern(
        params.companyId ? `driver:list:${params.companyId}:*` : 'driver:list:*'
    )

    return {
        message: 'OK',
    }
}
