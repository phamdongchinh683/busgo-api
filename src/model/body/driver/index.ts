import {
    AuthUserId,
    AuthUserPublicId,
    AuthUserRole,
    AuthUserStatus,
} from '../../../database/auth/user/type.js'
import { Email, Phone } from '../../common.js'
import { PublicApiId } from '../../public-id.js'
import { z } from 'zod'

export const DriverResponse = z.object({
    id: PublicApiId(AuthUserPublicId, AuthUserId),
    fullName: z.string(),
    email: Email.nullable(),
    phone: Phone.nullable(),
    role: AuthUserRole,
    status: AuthUserStatus,
})

export type DriverResponse = z.infer<typeof DriverResponse>

export const DriverListResponse = z.object({
    drivers: z.array(
        DriverResponse.extend({
            cancelledTripCount: z.number(),
            completedTripCount: z.number(),
        })
    ),
    next: AuthUserId.nullable(),
})

export type DriverListResponse = z.infer<typeof DriverListResponse>

export const DriverStatResponse = z.object({
    current: z.object({
        year: z.number(),
        month: z.number(),
        completedTripCount: z.number(),
        cancelledTripCount: z.number(),
    }),
})
export type DriverStatResponse = z.infer<typeof DriverStatResponse>

export const DriverStatsResponse = z.object({
    stats: z.array(
        z.object({
            year: z.number(),
            month: z.number(),
            completedTripCount: z.number(),
            cancelledTripCount: z.number(),
        })
    ),
})

export type DriverStatsResponse = z.infer<typeof DriverStatsResponse>
