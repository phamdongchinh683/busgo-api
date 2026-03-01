import z from 'zod'

export const DashboardOverviewSchema = z.object({
    totalUsers: z.number(),
    totalBookings: z.number(),
    totalRevenue: z.number(),
    totalCompanies: z.number(),
})

export type DashboardOverviewSchema = z.infer<typeof DashboardOverviewSchema>

export const DashboardResponseSchema = z.object({
    overview: DashboardOverviewSchema,
})

export type DashboardResponseSchema = z.infer<typeof DashboardResponseSchema>
