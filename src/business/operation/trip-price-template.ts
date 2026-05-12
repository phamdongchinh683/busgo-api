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

export async function createTripPriceTemplate(params: {
    body: OperationTripPriceTemplateTableInsert
}) {
    return {
        tripPriceTemplate: await dal.operation.tripPriceTemplate.cmd.createOne(params.body),
    }
}

export async function getTripPriceTemplates(params: {
    q: TripPriceTemplateFilter
    user: UserInfo
}) {
    if (!params.user.companyId) {
        throw new HttpErr.Forbidden('You are not allowed to access trip price templates')
    }

    const result = await dal.operation.tripPriceTemplate.query.findAllByCompanyId({
        q: params.q,
        companyId: params.user.companyId,
        routeId: params.q.routeId,
    })
    const { data, next } = utils.common.paginateByCursor(result, params.q.limit)

    return {
        prices: data,
        next,
    }
}

export async function updateTripPriceTemplates(params: {
    id: OperationTripPriceTemplateId
    body: OperationTripPriceTemplateTableUpdate
}) {
    return {
        tripPriceTemplate: await dal.operation.tripPriceTemplate.query.updateOneById(
            params.id,
            params.body
        ),
    }
}

export async function deleteTripPriceTemplate(params: { id: OperationTripPriceTemplateId }) {
    return {
        tripPriceTemplate: await dal.operation.tripPriceTemplate.cmd.deleteOneById(params.id),
    }
}
