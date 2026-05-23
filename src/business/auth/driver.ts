import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { DriverQuery } from '../../model/query/driver/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

export async function register(
    body: AuthBody,
    role: AuthUserRole,
    companyId: OrganizationBusCompanyId
) {
    const data = {
        fullName: body.fullName,
        ...utils.common.parseContactInfo(body.contactInfo),
        password: utils.password.hashPassword(body.password),
        role,
        status: AuthUserStatus.enum.inactive,
    }

    return dal.auth.user.cmd.insertDriver(data, companyId)
}

export async function getDrivers(query: DriverQuery, companyId: OrganizationBusCompanyId) {
    return utils.cache.cacheQuery({
        prefix: `driver:list:${companyId}`,
        query,
        ttl: 3600,
        queryFn: async () => {
            const drivers = await dal.auth.user.query.findAllDrivers(query, companyId)
            const { data, next } = utils.common.paginateByCursor(drivers, query.limit)
            return {
                drivers: data,
                next: next,
            }
        },
    })
}
