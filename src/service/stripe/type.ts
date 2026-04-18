import { z } from 'zod'
export const StripeStatusReponse = z.object({
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
})

export type StripeStatusReponse = z.infer<typeof StripeStatusReponse>
