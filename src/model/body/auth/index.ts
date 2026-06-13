import { z } from 'zod'
import { ContactInfo, Email, Otp, Phone, UserInfo } from '../../common.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthUserId, AuthUserStatus } from '../../../database/auth/user/type.js'

const regPassword = `^(?=.*[a-z])(?=.*\\d)(?=.*[#@\\$%&!\\*\\?\\^_])(?!.*\\s).+$`
const message =
    'Mật khẩu phải có chữ thường, chữ số, một ký tự đặc biệt (# @ $ % & ! * ? ^ _) và không chứa khoảng trắng.'

export const AuthPassword = z.string().regex(new RegExp(regPassword), message).default('abcd12345#')
export type AuthPassword = z.infer<typeof AuthPassword>

export const AuthBody = z.object({
    firstName: z.string(),
    lastName: z.string(),
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
    user: UserInfo.omit({ tokenVersion: true }),
})

export type AuthResponse = z.infer<typeof AuthResponse>

export const AuthSignInBody = z.object({
    phone: Phone.optional(),
    email: Email.optional(),
    password: AuthPassword,
})

export type AuthSignInBody = z.infer<typeof AuthSignInBody>

export const AuthCompanyAdminSignUpBody = AuthBody.extend({
    name: z.string().min(5),
    logoUrl: z.string().default(''),
    address: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
})

export type AuthCompanyAdminSignUpBody = z.infer<typeof AuthCompanyAdminSignUpBody>

export const AuthCompanyAdminSignUpRequestBody = AuthCompanyAdminSignUpBody

export type AuthCompanyAdminSignUpRequestBody = z.infer<typeof AuthCompanyAdminSignUpRequestBody>

export const AuthCompanyAdminSignUpResponse = z.object({
    message: z.string().optional(),
    token: z.string().optional(),
    user: UserInfo.omit({ tokenVersion: true }).optional(),
})

export type AuthCompanyAdminSignUpResponse = z.infer<typeof AuthCompanyAdminSignUpResponse>

export const AuthVerifyAccountBody = z.object({
    id: AuthUserId,
    status: AuthUserStatus,
})

export type AuthVerifyAccountBody = z.infer<typeof AuthVerifyAccountBody>

const AuthForgotPasswordBase = z.object({
    otp: Otp,
    password: AuthPassword,
})

export const AuthForgotPasswordBody = z.union([
    AuthForgotPasswordBase.extend({
        email: Email,
        phone: z.never().optional(),
    }),
    AuthForgotPasswordBase.extend({
        email: z.never().optional(),
        phone: Phone,
    }),
])

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
})

export type AuthGoogleBody = z.infer<typeof AuthGoogleBody>

export const AuthFacebookBody = z.object({
    accessToken: z.string(),
    idToken: z.string(),
})

export type AuthFacebookBody = z.infer<typeof AuthFacebookBody>
