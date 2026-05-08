import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { PromotionNewsBody } from '../../model/body/promotion-new/index.js'
import { PromotionNewsListQuery } from '../../model/query/promotion-new/index.js'
import { utils } from '../../utils/index.js'
import { BookingPromotionNewsId } from '../../database/booking/promotion_new/type.js'

export async function createOne(createdBy: AuthUserId, body: PromotionNewsBody) {
   const result = await dal.booking.promotionNews.cmd.createOne({
        ...body,
        createdBy,
    })

    return { item: result }
}

export async function list(query: PromotionNewsListQuery) {
    const result = await dal.booking.promotionNews.query.findAll(query)
    const { data, next } = utils.common.paginateByCursor(result, query.limit)

    return {
        items: data,
        next,
    }
}

export async function updateOne(params: { id: BookingPromotionNewsId; body: PromotionNewsBody }) {
    const { id, body } = params
    await dal.booking.promotionNews.cmd.updateOne(id, body)

    return { message: 'OK' }
}
