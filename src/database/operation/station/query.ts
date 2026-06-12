import { StationFilter } from '../../../model/query/station/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { db } from '../../../datasource/db.js'
import { OperationStationId } from './type.js'

export async function findById(id: OperationStationId, companyId: OrganizationBusCompanyId) {
    return db
        .selectFrom('operation.station as s')
        .select('s.id')
        .where('s.id', '=', id)
        .where('s.companyId', '=', companyId)
        .executeTakeFirst()
}

export async function findAllByCompanyId(params: {
    q: StationFilter
    companyId: OrganizationBusCompanyId
}) {
    return db
        .selectFrom('operation.station as s')
        .where('s.companyId', '=', params.companyId)
        .where(eb => {
            const cond = []
            if (params.q.city) {
                cond.push(eb('s.city', '=', params.q.city))
            }
            if (params.q.next) {
                cond.push(eb('s.id', '>', params.q.next))
            }
            return eb.and(cond)
        })
        .selectAll()
        .select(['s.id as cursorId', 's.publicId as id'])
        .limit(params.q.limit + 1)
        .orderBy('s.id')
        .execute()
}
