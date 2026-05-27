import z from 'zod'
import { AuthUserId, AuthUserRole, AuthUserStatus } from '../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../database/auth/staff_profile/type.js'
import { OrganizationBusCompanyId } from '../database/organization/bus_company/type.js'

function emailDomain(email: string): string {
    const i = email.lastIndexOf('@')
    if (i < 0) return ''
    return email.slice(i + 1).toLowerCase()
}

const EXAMPLE_EMAIL_DOMAIN = /^(?:.+\.)?example\.(?:com|org|net)$/i

export const Email = z.email().refine(v => !EXAMPLE_EMAIL_DOMAIN.test(emailDomain(v)), {
    message: 'Email không được sử dụng tên miền example.com, example.org hoặc example.net.',
})

export type Email = z.infer<typeof Email>

export const Phone = z
    .string()
    .trim()
    .regex(/^\d{10,13}$/, 'Số điện thoại chỉ được chứa chữ số và có độ dài từ 10 đến 13 ký tự.')
export type Phone = z.infer<typeof Phone>

export const ContactInfo = z.object({
    email: Email,
    phone: Phone,
})
export type ContactInfo = z.infer<typeof ContactInfo>

export const UserInfo = z.object({
    id: AuthUserId,
    email: Email,
    phone: Phone.nullable(),
    role: AuthUserRole,
    fullName: z.string(),
    tokenVersion: z.number().int().nonnegative(),
    staffProfileRole: AuthStaffProfileRole.nullable().optional(),
    companyId: OrganizationBusCompanyId.nullable().optional(),
    status: AuthUserStatus,
    accountStripeId: z.string().nullable(),
    lastChangeContact: z.date().nullable(),
})

export type UserInfo = z.infer<typeof UserInfo>

export const OrderBy = z.enum(['asc', 'desc'])
export type OrderBy = z.infer<typeof OrderBy>

function parseDateInput(value: unknown) {
    if (typeof value !== 'string') return value

    const trimmed = value.trim()
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed)
    if (!match) return trimmed

    const [, dayText, monthText, yearText] = match
    const day = Number(dayText)
    const month = Number(monthText)
    const year = Number(yearText)
    const date = new Date(Date.UTC(year, month - 1, day))

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return new Date(Number.NaN)
    }

    return date
}

export const DateInput = z.preprocess(
    parseDateInput,
    z.union([z.date(), z.string().trim().min(1), z.number()]).pipe(z.coerce.date())
)
export type DateInput = z.infer<typeof DateInput>

export const MessageResponse = z.object({
    message: z.string(),
})
export type MessageResponse = z.infer<typeof MessageResponse>

export const PeriodFilter = z.object({
    type: z.enum(['monthly', 'yearly']),
    year: z.coerce.number().optional(),
})
export type PeriodFilter = z.infer<typeof PeriodFilter>

export const PeriodResponse = z.object({
    data: z.array(z.array(z.number())),
})
export type PeriodResponse = z.infer<typeof PeriodResponse>

export const Otp = z.string().min(6).max(6)

export type Otp = z.infer<typeof Otp>
