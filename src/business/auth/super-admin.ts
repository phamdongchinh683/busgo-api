import { dal } from '../../database/index.js'
import { AuthUserId, AuthUserStatus } from '../../database/auth/user/type.js'
import { AuthPassword } from '../../model/body/auth/index.js'
import { PeriodUserQuery } from '../../model/query/user/index.js'
import type { UserListQuery } from '../../model/body/user/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'

export async function getDashboard() {
    const [totalUsers, totalBookings, totalRevenue, totalCompanies] = await Promise.all([
        dal.auth.user.query.countAll(),
        dal.booking.booking.query.countAll(),
        dal.booking.booking.query.getTotalRevenue(),
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

export async function updateNewPassword(id: AuthUserId, password: AuthPassword) {
    await dal.auth.user.cmd.updatePassword({
        userId: id,
        password: password,
    })
    return {
        message: 'Thành công',
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

    return {
        message: 'Thành công',
    }
}

export async function listUsers(query: UserListQuery) {
    const rows = await dal.auth.user.query.findAll(query)
    const { data, next } = utils.common.paginateByCursor(rows, query.limit)
    return {
        users: data,
        next,
    }
}

export async function updateOne(id: AuthUserId, data: Record<string, unknown>) {
    await dal.auth.user.cmd.updateOne(id, data)
    return { message: 'Thành công' }
}

export async function deleteOne(id: AuthUserId) {
    await dal.auth.user.cmd.deleteOne(id)
    return { message: 'Thành công' }
}
