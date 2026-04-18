import z from 'zod'

export const PaymentMethodResponse = z.object({
    message: z.string(),
    paymentUrl: z.string().optional(),
    paymentIntentId: z.string().optional(),
    clientSecret: z.string().optional(),
})

export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponse>

export const VnPayIpnResponse = z.object({
    RspCode: z.string().optional(),
    Message: z.string().optional(),
})

export type VnPayIpnResponse = z.infer<typeof VnPayIpnResponse>

export const RevenueResponse = z.object({
    total: z.number(),
})

export type RevenueResponse = z.infer<typeof RevenueResponse>

export const PaymentDeleteResponse = z.object({
    message: z.string(),
})

export type PaymentDeleteResponse = z.infer<typeof PaymentDeleteResponse>

export const StripeConnectResponse = z.object({
    message: z.string(),
    url: z.string(),
})

export type StripeConnectResponse = z.infer<typeof StripeConnectResponse>

export const StripeConnectStatusResponse = z.object({
    message: z.string(),
    accountId: z.string(),
    detailsSubmitted: z.boolean(),
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
    currentlyDue: z.array(z.string()),
    eventuallyDue: z.array(z.string()),
    pastDue: z.array(z.string()),
})

export type StripeConnectStatusResponse = z.infer<typeof StripeConnectStatusResponse>

export const StripeSetupIntentResponse = z.object({
    clientSecret: z.string(),
})

export type StripeSetupIntentResponse = z.infer<typeof StripeSetupIntentResponse>
