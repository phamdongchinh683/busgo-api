import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import {
    BusCompanyReviewBody,
    BusCompanyReviewListResponse,
} from '../../model/body/review/index.js'
import { utils } from '../../utils/index.js'
import { BusCompanyReviewFilter } from '../../model/query/review/index.js'

export async function insertOne(params: { userId: AuthUserId; body: BusCompanyReviewBody }) {
    const { userId, body } = params

    const trip = await dal.operation.trip.query.findById(body.tripId)

    await dal.organization.busCompanyReview.cmd.insertOne({
        companyId: trip.companyId,
        userId,
        rating: body.rating,
        comment: body.comment ?? null,
    })

    return { message: 'OK' }
}

export async function getReviewByCompany(query: BusCompanyReviewFilter) {
    const key = utils.cache.cacheKey('bus-company-review:list', query)

    const cached = await utils.cache.getCache<BusCompanyReviewListResponse>(key)

    if (cached) {
        return cached
    }

    const result = await dal.organization.busCompanyReview.query.findAllByCompany(query)

    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    const response = {
        comments: data,
        next,
    }

    void utils.cache.setCache(key, response, 60)

    return response
}
