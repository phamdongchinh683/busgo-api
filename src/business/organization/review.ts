import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { BusCompanyReviewBody } from '../../model/body/review/index.js'
import { utils } from '../../utils/index.js'
import { BusCompanyReviewFilter } from '../../model/query/review/index.js'
import { clearTripScheduleListCache } from '../operation/trip-schedule.js'

export async function createOne(params: { userId: AuthUserId; body: BusCompanyReviewBody }) {
    const { userId, body } = params

    const trip = await dal.operation.trip.query.findById(body.tripId)

    await dal.organization.busCompanyReview.cmd.upsertOne({
        companyId: trip.companyId,
        userId,
        ticketId: body.ticketId,
        rating: body.rating,
        comment: body.comment ?? null,
    })

    await Promise.all([
        utils.cache.delCacheByPattern(`bus-company-review:list:${trip.companyId}:*`),
        utils.cache.delCacheByPattern('bus-company:list:*'),
        clearTripScheduleListCache(trip.companyId),
    ])

    return { message: 'Thành công' }
}

export async function getReviewByCompany(query: BusCompanyReviewFilter) {
    return utils.cache.cacheQuery({
        prefix: `bus-company-review:list:${query.companyId}`,
        query,
        ttl: 3600,
        queryFn: async () => {
            const result = await dal.organization.busCompanyReview.query.findAllByCompany(query)

            const { data, next } = utils.common.paginateByCursor(result, query.limit)

            return {
                comments: data,
                next,
            }
        },
    })
}
