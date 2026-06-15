import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { BusCompanyReviewBody } from '../../model/body/review/index.js'
import { utils } from '../../utils/index.js'
import { BusCompanyReviewFilter } from '../../model/query/review/index.js'
import { clearTripScheduleListCache } from '../operation/trip-schedule.js'
import { HttpErr } from '../../app/index.js'
import { OperationTripStatus } from '../../database/operation/trip/type.js'
import { db } from '../../datasource/db.js'

export async function createOne(params: { userId: AuthUserId; body: BusCompanyReviewBody }) {
    const { userId, body } = params
    const bookingInfo = await dal.booking.booking.query.getBookingByUserIdAndBookingId({
        userId,
        ticketId: body.ticketId,
    })

    if (!bookingInfo) {
        throw new HttpErr.Forbidden('Bạn không sở hữu vé này.')
    }

    if (bookingInfo.tripId !== body.tripId) {
        throw new HttpErr.BadRequest('Vé không thuộc về chuyến đi này.')
    }

    if (bookingInfo.tripStatus !== OperationTripStatus.enum.completed) {
        throw new HttpErr.BadRequest(
            'Chuyến đi chưa hoàn thành, bạn chỉ có thể đánh giá sau khi chuyến kết thúc.'
        )
    }

    if (bookingInfo.isRate === true) {
        throw new HttpErr.BadRequest('Chuyến đi đã đánh giá rồi.')
    }

    return db.transaction().execute(async trx => {
        await dal.organization.busCompanyReview.cmd.upsertOne({
            companyId: bookingInfo.companyId,
            userId,
            ticketId: body.ticketId,
            rating: body.rating,
            comment: body.comment ?? null,
        })

        await dal.booking.ticket.cmd.updateById(
            body.ticketId,
            {
                isRate: true,
            },
            trx
        )

        await Promise.all([
            utils.cache.delCacheByPattern(`bus-company-review:list:${bookingInfo.companyId}:*`),
            utils.cache.delCacheByPattern('bus-company:list:*'),
            clearTripScheduleListCache(bookingInfo.companyId),
        ])

        return { message: 'Thành công' }
    })
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
