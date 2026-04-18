import { z } from 'zod'
import { PaymentCustomerPaymentMethodId } from '../../database/payment/customer_payment_method/type.js'
export const StripeStatusReponse = z.object({
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
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
