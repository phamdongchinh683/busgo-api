import { AuthUserId } from '../../auth/user/type.js'
import { utils } from '../../../utils/index.js'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

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

export async function getStatsByDriverIdOnly(id: AuthUserId) {
    const now = utils.time.getNow()

    return db
        .selectFrom('organization.driver_monthly_stat as dms')
        .where(eb => {
            const cond = []
            cond.push(eb('dms.driverId', '=', id))
            cond.push(eb('dms.year', '=', now.year()))
            return eb.and(cond)
        })
        .selectAll('dms')
        .execute()
}
