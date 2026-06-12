import { AuthUserId } from '../../auth/user/type.js'
import { utils } from '../../../utils/index.js'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function getDriverStats(params: {
    driverId: AuthUserId
    year?: number
    month?: number
}) {
    const now = utils.time.getNow()

    const year = params.year ?? now.year()
    const month = params.month ?? now.month() + 1

    return db
        .selectFrom('organization.driver_monthly_stat')
        .where(eb => {
            const cond = []
            cond.push(eb('driverId', '=', params.driverId))
            cond.push(eb('year', '=', year))
            cond.push(eb('month', '=', month))
            return eb.and(cond)
        })
        .selectAll()
        .executeTakeFirst()
}

export async function getStatsByDriverId(id: AuthUserId, companyId: OrganizationBusCompanyId) {
    const now = utils.time.getNow()

    return db
        .selectFrom('organization.driver_monthly_stat as dms')
        .innerJoin('organization.company_member as cm', 'cm.userId', 'dms.driverId')
        .where(eb => {
            const cond = []
            cond.push(eb('dms.driverId', '=', id))
            cond.push(eb('dms.year', '=', now.year()))
            cond.push(eb('cm.companyId', '=', companyId))
            return eb.and(cond)
        })
        .selectAll('dms')
        .execute()
}
