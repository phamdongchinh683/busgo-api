import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { PaymentCustomerPaymentMethodId, PaymentCustomerPaymentMethodPublicId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface PaymentCustomerPaymentMethodTable extends Timestamps {
    id: GeneratedAlways<PaymentCustomerPaymentMethodId>
    publicId: GeneratedAlways<PaymentCustomerPaymentMethodPublicId>
    userId: AuthUserId
    stripeCustomerId: string
    stripePaymentMethodId: string
    brand: string | null
    last4: string | null
    expMonth: number | null
    expYear: number | null
    isDefault: boolean
}

export type PaymentCustomerPaymentMethodTableInsert = Insertable<PaymentCustomerPaymentMethodTable>
export type PaymentCustomerPaymentMethodTableSelect = Selectable<PaymentCustomerPaymentMethodTable>
export type PaymentCustomerPaymentMethodTableUpdate = Updateable<PaymentCustomerPaymentMethodTable>
