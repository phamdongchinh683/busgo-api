import { z } from 'zod'
import { PaymentCustomerPaymentMethodId } from '../../database/payment/customer_payment_method/type.js'
export const StripeStatusReponse = z.object({
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
    currentlyDue: z.array(z.string()),
})

export type StripeStatusReponse = z.infer<typeof StripeStatusReponse>

export const StripeAttachPaymentMethodRequest = z.object({
    paymentMethodId: z.string(),
})

export type StripeAttachPaymentMethodRequest = z.infer<typeof StripeAttachPaymentMethodRequest>

export const StripeGetPaymentMethodsResponse = z.object({
    paymentMethods: z.array(
        z.object({
            id: PaymentCustomerPaymentMethodId,
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
})

export type StripePayoutListResponse = z.infer<typeof StripePayoutListResponse>

export const StripePayoutDetailResponse = z.object({
    payout: StripePayoutItem,
})

export type StripePayoutDetailResponse = z.infer<typeof StripePayoutDetailResponse>
