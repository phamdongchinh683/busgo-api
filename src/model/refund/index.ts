import z from 'zod'

export const RefundPaymentBody = z.object({
    transactionCode: z.string(),
    amount: z.number(),
    transactionNo: z.string(),
})

export type RefundPaymentBody = z.infer<typeof RefundPaymentBody>
