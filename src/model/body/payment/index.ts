import z from 'zod'

export const PaymentMethodResponse = z.object({
    message: z.string(),
    paymentUrl: z.string().optional(),
    orderUrl: z.string().optional(),
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


export const StripeBankAccountResponse = z.object({
    message: z.string(),
    accountId: z.string(),
})

export type StripeBankAccountResponse = z.infer<typeof StripeBankAccountResponse>