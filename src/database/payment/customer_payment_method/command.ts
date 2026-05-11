import { db } from '../../../datasource/db.js'
import { PaymentCustomerPaymentMethodTableInsert } from './table.js'
import { AuthUserId } from '../../auth/user/type.js'
import { Database } from '../../../datasource/type.js'
import { Transaction } from 'kysely'

export async function upsertOne(
    params: PaymentCustomerPaymentMethodTableInsert,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .insertInto('payment.customer_payment_method')
        .values(params)
        .onConflict(oc => oc.column('stripePaymentMethodId').doUpdateSet(params))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function resetDefaultByUser(
    params: { userId: AuthUserId; stripeCustomerId: string },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('payment.customer_payment_method')
        .set({ isDefault: false })
        .where('userId', '=', params.userId)
        .where('stripeCustomerId', '=', params.stripeCustomerId)
        .executeTakeFirst()
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

export async function updateOne(
    params: {
        userId: AuthUserId
        stripePaymentMethodId: string
        accountStripeId: string
        isDefault: boolean
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('payment.customer_payment_method')
        .set({ isDefault: params.isDefault })
        .where(eb => {
            const cond = []
            cond.push(eb('userId', '=', params.userId))
            cond.push(eb('stripePaymentMethodId', '=', params.stripePaymentMethodId))
            cond.push(eb('stripeCustomerId', '=', params.accountStripeId))
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}
