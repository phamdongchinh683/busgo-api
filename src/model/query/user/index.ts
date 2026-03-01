import { PeriodFilter } from "../../common.js"
import { AuthUserRole, AuthUserStatus } from "../../../database/auth/user/type.js"
import { OrganizationBusCompanyId } from "../../../database/organization/bus_company/type.js"
import z from "zod"

export const PeriodUserQuery = PeriodFilter.extend({
    status: AuthUserStatus.optional(),
    role: AuthUserRole.optional(),
})

export type PeriodUserQuery = z.infer<typeof PeriodUserQuery>