import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { BusCompanyListQuery } from '../../model/query/bus-company/index.js'
import { BusCompanyBody } from '../../model/body/bus-company/index.js'

export async function list(query: BusCompanyListQuery) {
    return utils.cache.cacheQuery({
        prefix: 'bus-company:list',
        query,
        ttl: 3600,
        queryFn: async () => {
            const result = await dal.organization.busCompany.query.findAll(query)
            const { data, next } = utils.common.paginateByCursor(result, query.limit)
            return {
                companies: data,
                next: next,
            }
        },
    })
}

export async function getOne(id: OrganizationBusCompanyId) {
    return {
        company: await dal.organization.busCompany.cmd.getOne(id),
    }
}

export async function updateOne(id: OrganizationBusCompanyId, data: BusCompanyBody) {
    return {
        company: await dal.organization.busCompany.cmd.updateOne(id, data),
    }
}
