import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { BookingPromotionNewsTableInsert } from './table.js'
import { BookingPromotionNewsId } from './type.js'
import { PromotionNewsBody } from '../../../model/body/promotion-new/index.js'

export async function createOne(params: BookingPromotionNewsTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as BookingPromotionNewsTableInsert
    return db
        .insertInto('booking.promotion_new')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updateOne(id: BookingPromotionNewsId, body: PromotionNewsBody) {
    const data = _.omitBy(body, v => _.isNil(v))
    return db
        .updateTable('booking.promotion_new')
        .set(data)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}
