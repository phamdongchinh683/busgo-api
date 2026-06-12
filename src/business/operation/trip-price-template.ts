import { HttpErr } from '../../app/index.js'
import { dal } from '../../database/index.js'
import {
    OperationTripPriceTemplateTableInsert,
    OperationTripPriceTemplateTableUpdate,
} from '../../database/operation/trip_price_template/table.js'
import { OperationTripPriceTemplateId } from '../../database/operation/trip_price_template/type.js'
import { UserInfo } from '../../model/common.js'
import { TripPriceTemplateFilter } from '../../model/query/trip-price-template/index.js'
import { utils } from '../../utils/index.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'

const TRIP_PRICE_TEMPLATE_CACHE_PREFIX = 'trip-price-template:list'

export async function createTripPriceTemplate(params: {
    body: OperationTripPriceTemplateTableInsert
}) {
    await assertCompanyStations(params.body)
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.cmd.createOne(params.body)

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${params.body.companyId}:*`
    )

    return {
        tripPriceTemplate: await dal.operation.tripPriceTemplate.query.getPublicById(
            tripPriceTemplate.internalId
        ),
    }
}

export async function getTripPriceTemplates(params: {
    q: TripPriceTemplateFilter
    user: UserInfo
}) {
    if (!params.user.companyId) {
        throw new HttpErr.Forbidden('Bạn không có quyền truy cập bảng giá chuyến đi.')
    }
    const companyId = params.user.companyId

    return utils.cache.cacheQuery({
        prefix: `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${companyId}`,
        query: params.q,
        ttl: 3600,
        queryFn: async () => {
            const result = await dal.operation.tripPriceTemplate.query.findAllByCompanyId({
                q: params.q,
                companyId,
                routeId: params.q.routeId,
            })
            const { data, next } = utils.common.paginateByCursor(result, params.q.limit)

            return {
                prices: data,
                next,
            }
        },
    })
}

export async function updateTripPriceTemplates(params: {
    id: OperationTripPriceTemplateId
    body: OperationTripPriceTemplateTableUpdate & { companyId: OrganizationBusCompanyId }
}) {
    await assertCompanyStations(params.body)
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.query.updateOneById(
        params.id,
        params.body
    )

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${tripPriceTemplate.companyId}:*`
    )

    return {
        tripPriceTemplate: await dal.operation.tripPriceTemplate.query.getPublicById(
            tripPriceTemplate.internalId
        ),
    }
}

export async function deleteTripPriceTemplate(params: {
    id: OperationTripPriceTemplateId
    companyId: OrganizationBusCompanyId
}) {
    const publicTripPriceTemplate = await dal.operation.tripPriceTemplate.query.getPublicById(
        params.id
    )
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.cmd.deleteOneById(
        params.id,
        params.companyId
    )

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${tripPriceTemplate.companyId}:*`
    )

    return {
        tripPriceTemplate: publicTripPriceTemplate,
    }
}

async function assertCompanyStations(params: {
    companyId: OrganizationBusCompanyId
    fromStationId?: OperationTripPriceTemplateTableUpdate['fromStationId']
    toStationId?: OperationTripPriceTemplateTableUpdate['toStationId']
}) {
    const stations = await Promise.all(
        [params.fromStationId, params.toStationId]
            .filter(stationId => stationId !== undefined)
            .map(stationId => dal.operation.station.query.findById(stationId, params.companyId))
    )

    if (stations.some(station => !station)) {
        throw new HttpErr.Forbidden('Trạm dừng không thuộc công ty của bạn.')
    }
}
