import z from 'zod'
import { OrganizationDriverMonthlyStatId } from '../../../database/organization/driver_monthly_stat/type.js'

export const DriverMonthlyStatQuery = z.object({
    year: z.number().optional(),
    month: z.number().optional(),
    limit: z.number().min(10).max(100).default(10),
})

export type DriverMonthlyStatQuery = z.infer<typeof DriverMonthlyStatQuery>

export const DriverMonthlyStatsQuery = z.object({
    year: z.number().optional(),
    limit: z.number().min(10).max(100).default(10),
    next: OrganizationDriverMonthlyStatId.nullable(),
})

export type DriverMonthlyStatsQuery = z.infer<typeof DriverMonthlyStatsQuery>
