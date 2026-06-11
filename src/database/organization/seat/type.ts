import { z } from 'zod'

export const OrganizationSeatId = z.coerce.number().brand<'organization.seat.id'>()
export type OrganizationSeatId = z.infer<typeof OrganizationSeatId>

export const OrganizationSeatPublicId = z.uuid().brand<'organization.seat.public_id'>()
export type OrganizationSeatPublicId = z.infer<typeof OrganizationSeatPublicId>

export const OrganizationSeatType = z.union([z.literal(1), z.literal(2)])
export type OrganizationSeatType = z.infer<typeof OrganizationSeatType>
