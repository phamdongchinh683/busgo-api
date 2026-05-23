import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { BusCompanyBody } from '../../model/body/bus-company/index.js'
import { utils } from '../../utils/index.js'
import { BusCompanyListQuery } from '../../model/query/bus-company/index.js'
import { OrganizationBusCompanyTableUpdate } from '../../database/organization/bus_company/table.js'

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

export async function createOne(body: BusCompanyBody) {
    const company = await dal.organization.busCompany.cmd.upsertOne({
        ...body,
        reviewCount: 0,
        reviewAvgStars: 0,
    })

    await Promise.all([
        utils.cache.delCacheByPattern('bus-company:list:*'),
        utils.cache.delCacheByPattern('trip-schedule:list:*'),
    ])

    return {
        company,
    }
}

export async function deleteOne(id: OrganizationBusCompanyId) {
    const company = await dal.organization.busCompany.cmd.deleteOne(id)

    await Promise.all([
        utils.cache.delCacheByPattern('bus-company:list:*'),
        utils.cache.delCacheByPattern('trip-schedule:list:*'),
    ])

    return { company }
}

export async function updateOne(
    id: OrganizationBusCompanyId,
    body: OrganizationBusCompanyTableUpdate
) {
    const company = await dal.organization.busCompany.cmd.updateOne(id, body)

    await Promise.all([
        utils.cache.delCacheByPattern('bus-company:list:*'),
        utils.cache.delCacheByPattern('trip-schedule:list:*'),
    ])

    return { company }
}

export async function getOne(id: OrganizationBusCompanyId) {
    return { company: await dal.organization.busCompany.cmd.getOne(id) }
}
