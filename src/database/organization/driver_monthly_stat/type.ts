import { z } from 'zod'

export const OrganizationDriverMonthlyStatId = z.coerce
    .number()
    .brand<'organization.driver_monthly_stat.id'>()
export type OrganizationDriverMonthlyStatId = z.infer<typeof OrganizationDriverMonthlyStatId>
