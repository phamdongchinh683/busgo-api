import { z } from 'zod'
import {
    PaymentCustomerPaymentMethodId,
    PaymentCustomerPaymentMethodPublicId,
} from '../../database/payment/customer_payment_method/type.js'
import { PublicApiId } from '../../model/public-id.js'

export const StripeStatusResponse = z.object({
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
    currentlyDue: z.array(z.string()),
})

export type StripeStatusResponse = z.infer<typeof StripeStatusResponse>

export const StripeAttachPaymentMethodRequest = z.object({
    paymentMethodId: z.string(),
})

export type StripeAttachPaymentMethodRequest = z.infer<typeof StripeAttachPaymentMethodRequest>

export const StripeGetPaymentMethodsResponse = z.object({
    paymentMethods: z.array(
        z.object({
            id: PublicApiId(PaymentCustomerPaymentMethodPublicId, PaymentCustomerPaymentMethodId),
            brand: z.string().nullable(),
            last4: z.string().nullable(),
            expMonth: z.number().nullable(),
            expYear: z.number().nullable(),
            stripeCustomerId: z.string(),
            stripePaymentMethodId: z.string(),
            isDefault: z.boolean(),
        })
    ),
})

export type StripeGetPaymentMethodsResponse = z.infer<typeof StripeGetPaymentMethodsResponse>

export const BalanceResponse = z.object({
    available: z.array(
        z.object({
            amount: z.number(),
            currency: z.string(),
        })
    ),
    pending: z.array(
        z.object({
            amount: z.number(),
            currency: z.string(),
        })
    ),
})

export type BalanceResponse = z.infer<typeof BalanceResponse>

export const StripePayoutRequest = z.object({
    amount: z.number().min(500000),
})

export type StripePayoutRequest = z.infer<typeof StripePayoutRequest>

export const StripePayoutResponse = z.object({
    message: z.string(),
    amountVnd: z.number(),
    amountUsdCents: z.number(),
})

export type StripePayoutResponse = z.infer<typeof StripePayoutResponse>

export const StripePayoutItem = z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    arrival_date: z.number(),
    created: z.number(),
})

export const StripePayoutListResponse = z.object({
    payouts: z.array(StripePayoutItem),
    next: z.string().nullable(),
})

export type StripePayoutListResponse = z.infer<typeof StripePayoutListResponse>

export const StripePayoutListRequest = z.object({
    limit: z.coerce.number().min(10).max(100).optional(),
    next: z.string().optional(),
    status: z.enum(['paid', 'pending', 'in_transit', 'canceled', 'failed']).optional(),
})

export type StripePayoutListRequest = z.infer<typeof StripePayoutListRequest>
