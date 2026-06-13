import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

export async function getDriverDetail(id: AuthUserId, companyId: OrganizationBusCompanyId) {
    return {
        stats: await dal.organization.driverMonthlyStat.query.getStatsByDriverId(id, companyId),
    }
}
