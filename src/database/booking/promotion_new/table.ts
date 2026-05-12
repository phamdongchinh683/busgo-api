import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { BookingPromotionNewsId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface BookingPromotionNewsTable extends Timestamps {
    id: GeneratedAlways<BookingPromotionNewsId>
    title: string
    content: string
    imageUrl: string | null
    isActive: boolean
    startDate: string | null
    endDate: string | null
    createdBy: AuthUserId | null
}

export type BookingPromotionNewsTableInsert = Insertable<BookingPromotionNewsTable>
export type BookingPromotionNewsTableSelect = Selectable<BookingPromotionNewsTable>
export type BookingPromotionNewsTableUpdate = Updateable<BookingPromotionNewsTable>
