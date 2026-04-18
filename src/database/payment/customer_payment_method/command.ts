import { db } from '../../../datasource/db.js'
import { PaymentCustomerPaymentMethodTableInsert } from './table.js'
import { AuthUserId } from '../../auth/user/type.js'

export async function upsertOne(params: PaymentCustomerPaymentMethodTableInsert) {
    return db
        .insertInto('payment.customer_payment_method')
        .values(params)
        .onConflict(oc => oc.column('stripePaymentMethodId').doUpdateSet(params))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function findMany(userId: AuthUserId) {
    return db
        .selectFrom('payment.customer_payment_method')
        .select([
            'id',
            'brand',
            'last4',
            'expMonth',
            'expYear',
            'stripeCustomerId',
            'stripePaymentMethodId',
            'isDefault',
        ])
        .where('userId', '=', userId)
        .execute()
}

export async function deleteOne(params: {
    userId: AuthUserId
    stripePaymentMethodId: string
    accountStripeId: string
}) {
    return db
        .deleteFrom('payment.customer_payment_method')
        .where(eb => {
            const cond = []
            cond.push(eb('userId', '=', params.userId))
            cond.push(eb('stripePaymentMethodId', '=', params.stripePaymentMethodId))
            cond.push(eb('stripeCustomerId', '=', params.accountStripeId))
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}
