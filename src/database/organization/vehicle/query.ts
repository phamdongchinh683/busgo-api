import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { VehicleFilter } from '../../../model/query/vehicle/index.js'

export async function findAll(params: VehicleFilter, companyId: OrganizationBusCompanyId) {
    const { limit, next, type, status } = params
    return db
        .selectFrom('organization.vehicle as v')
        .where(eb => {
            const cond = []
            cond.push(eb('v.companyId', '=', companyId))
            if (type) {
                cond.push(eb('v.type', '=', type))
            }
            if (status) {
                cond.push(eb('v.status', '=', status))
            }
            if (next) {
                cond.push(eb('v.id', '>', next))
            }
            return eb.and(cond)
        })

        .orderBy('v.id', 'asc')
        .limit(limit + 1)
        .selectAll()
        .select(['v.id'])
        .execute()
}
