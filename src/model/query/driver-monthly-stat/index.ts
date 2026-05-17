import z from 'zod'

export const DriverMonthlyStatQuery = z.object({
    year: z.number().optional(),
    month: z.number().optional(),
    limit: z.number().min(10).max(100).default(10),
})

export type DriverMonthlyStatQuery = z.infer<typeof DriverMonthlyStatQuery>
