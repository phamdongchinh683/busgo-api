import { z } from 'zod'
import { ContactInfo, Email, Otp, Phone, UserInfo } from '../../common.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from '../../../database/auth/user/type.js'

const regPassword = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[#@\\$%&!\\*\\?\\^_])(?!.*\\s).+$`
const message =
    'Password must contain uppercase, lowercase, a number, and one special character (# @ $ % & ! * ? ^ _), and no spaces'

export const AuthPassword = z.string().regex(new RegExp(regPassword), message).default('Abcd12345#')
export type AuthPassword = z.infer<typeof AuthPassword>

export const AuthBody = z.object({
    username: z.string().min(5),
    fullName: z.string().min(7),
    contactInfo: ContactInfo,
    password: AuthPassword,
})

export type AuthBody = z.infer<typeof AuthBody>

export const DriverSignUpBody = AuthBody.extend({
    companyId: OrganizationBusCompanyId,
})

export type DriverSignUpBody = z.infer<typeof DriverSignUpBody>

export const AuthResponse = z.object({
    message: z.string().optional(),
    token: z.string(),
    user: UserInfo.omit({ companyId: true, tokenVersion: true }),
})

export type AuthResponse = z.infer<typeof AuthResponse>

export const AuthSignInBody = z.object({
    username: z.string().min(5).optional(),
    phone: Phone.optional(),
    email: Email.optional(),
    password: AuthPassword,
})

export type AuthSignInBody = z.infer<typeof AuthSignInBody>

export const AuthCompanyAdminSignUpBody = z.object({
    username: z.string().min(5),
    fullName: z.string().min(7),
    contactInfo: ContactInfo,
    password: AuthPassword,
    companyId: OrganizationBusCompanyId,
})

export type AuthCompanyAdminSignUpBody = z.infer<typeof AuthCompanyAdminSignUpBody>

export const AuthCompanyAdminSignUpResponse = z.object({
    message: z.string(),
})

export type AuthCompanyAdminSignUpResponse = z.infer<typeof AuthCompanyAdminSignUpResponse>

export const AuthVerifyAccountBody = z.object({
    id: AuthUserId,
    status: AuthUserStatus,
})

export type AuthVerifyAccountBody = z.infer<typeof AuthVerifyAccountBody>

export const AuthForgotPasswordBody = z.object({
    otp: Otp,
    email: Email.optional(),
    phone: Phone.optional(),
    password: AuthPassword,
})

export type AuthForgotPasswordBody = z.infer<typeof AuthForgotPasswordBody>

export const AuthOtpBody = z.discriminatedUnion('field', [
    z.object({
        field: z.literal('email'),
        value: Email,
    }),
    z.object({
        field: z.literal('phone'),
        value: Phone,
    }),
])

export type AuthOtpBody = z.infer<typeof AuthOtpBody>

export const AuthGoogleBody = z.object({
    idToken: z.string(),
    role: z.enum([AuthUserRole.enum.customer, AuthUserRole.enum.driver]).default(AuthUserRole.enum.customer),
})

export type AuthGoogleBody = z.infer<typeof AuthGoogleBody>