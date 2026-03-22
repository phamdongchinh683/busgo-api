import z from 'zod'

export const TripSeatQuery = z.object({
    stopOrderPickup: z.coerce.number().int(),
    stopOrderDropoff: z.coerce.number().int(),
})

export type TripSeatQuery = z.infer<typeof TripSeatQuery>
