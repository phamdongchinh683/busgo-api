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

const TRIP_PRICE_TEMPLATE_CACHE_PREFIX = 'trip-price-template:list'

export async function createTripPriceTemplate(params: {
    body: OperationTripPriceTemplateTableInsert
}) {
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.cmd.createOne(params.body)

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${params.body.companyId}:*`
    )

    return {
        tripPriceTemplate,
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
    body: OperationTripPriceTemplateTableUpdate
}) {
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.query.updateOneById(
        params.id,
        params.body
    )

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${tripPriceTemplate.companyId}:*`
    )

    return {
        tripPriceTemplate,
    }
}

export async function deleteTripPriceTemplate(params: { id: OperationTripPriceTemplateId }) {
    const tripPriceTemplate = await dal.operation.tripPriceTemplate.cmd.deleteOneById(params.id)

    await utils.cache.delCacheByPattern(
        `${TRIP_PRICE_TEMPLATE_CACHE_PREFIX}:${tripPriceTemplate.companyId}:*`
    )

    return {
        tripPriceTemplate,
    }
}
