import { StationFilter } from '../../model/query/station/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { dal } from '../../database/index.js'
import { utils } from '../../utils/index.js'
import { StationBody } from '../../model/body/station/index.js'

export async function getStations(params: {
    q: StationFilter
    companyId: OrganizationBusCompanyId
}) {
    return utils.cache.cacheQuery({
        prefix: `station:list:${params.companyId}`,
        query: params.q,
        ttl: 3600,
        queryFn: async () => {
            const stations = await dal.operation.station.query.findAllByCompanyId({
                q: params.q,
                companyId: params.companyId,
            })
            const { data, next } = utils.common.paginateByCursor(stations, params.q.limit)

            return {
                stations: data,
                next: next,
            }
        },
    })
}

export async function createStation(params: {
    body: StationBody
    companyId: OrganizationBusCompanyId
}) {
    const station = await dal.operation.station.cmd.upsertOne({
        ...params.body,
        companyId: params.companyId,
    })

    await Promise.all([
        utils.cache.delCacheByPattern(`station:list:${params.companyId}:*`),
        utils.cache.delCacheByPattern('trip-schedule:pickup-stops:*'),
    ])

    return {
        station,
    }
}
