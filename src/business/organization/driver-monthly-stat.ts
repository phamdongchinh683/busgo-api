import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { utils } from '../../utils/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

export async function getDriverStat(params: {
    driverId: AuthUserId
    year?: number
    month?: number
}) {
    const now = utils.time.getNow()

    return {
        current: await dal.organization.driverMonthlyStat.cmd.upsertOne({
            driverId: params.driverId,
            year: params.year ?? now.year(),
            month: params.month ?? now.month() + 1,
            completedTripCount: 0,
            cancelledTripCount: 0,
        }),
    }
}

export async function getDriverDetail(id: AuthUserId, companyId: OrganizationBusCompanyId) {
    return {
        stats: await dal.organization.driverMonthlyStat.query.getStatsByDriverId(id, companyId),
    }
}
