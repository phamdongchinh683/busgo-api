import { db } from '../../datasource/db.js'
import { dal } from '../../database/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { utils } from '../../utils/index.js'
import { BusCompanyListQuery } from '../../model/query/bus-company/index.js'

export async function list(query: BusCompanyListQuery) {
    return utils.cache.cacheQuery({
        prefix: 'bus-company:list',
        query,
        ttl: 3600,
        queryFn: async () => {
            const result = await dal.organization.busCompany.query.findAll(query)
            const { data, next } = utils.common.paginateByCursor(result, query.limit)
            return {
                companies: data.map((r: unknown) => ({
                    id: (r as Record<string, unknown>).id as string | number,
                    name: (r as Record<string, unknown>).name as string,
                    hotline: (r as Record<string, unknown>).hotline as string,
                    logoUrl: (r as Record<string, unknown>).logoUrl as string,
                    address: (r as Record<string, unknown>).address as string,
                    latitude: (r as Record<string, unknown>).latitude as number,
                    longitude: (r as Record<string, unknown>).longitude as number,
                    reviewCount: (r as Record<string, unknown>).reviewCount as number,
                    star1: (r as Record<string, unknown>).star1 as number,
                    star2: (r as Record<string, unknown>).star2 as number,
                    star3: (r as Record<string, unknown>).star3 as number,
                    star4: (r as Record<string, unknown>).star4 as number,
                    star5: (r as Record<string, unknown>).star5 as number,
                })),
                next: next,
            }
        },
    })
}

export async function getOne(id: OrganizationBusCompanyId) {
    return db
        .selectFrom('organization.bus_company')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
}

export async function updateOne(
    id: OrganizationBusCompanyId,
    data: Partial<{
        name: string
        hotline: string
        logoUrl: string
        address: string
        latitude: number
        longitude: number
    }>
) {
    return db
        .updateTable('organization.bus_company')
        .set(data)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}
