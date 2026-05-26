import { z } from 'zod'
import { ContactInfo, Email, Otp, Phone, UserInfo } from '../../common.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthUserId, AuthUserStatus } from '../../../database/auth/user/type.js'

const regPassword = `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[#@\\$%&!\\*\\?\\^_])(?!.*\\s).+$`
const message =
    'Mật khẩu phải có chữ hoa, chữ thường, chữ số, một ký tự đặc biệt (# @ $ % & ! * ? ^ _) và không chứa khoảng trắng.'

export const AuthPassword = z.string().regex(new RegExp(regPassword), message).default('Abcd12345#')
export type AuthPassword = z.infer<typeof AuthPassword>

export const AuthBody = z.object({
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
    user: UserInfo.extend({
        driverCompanyId: OrganizationBusCompanyId.nullable().optional(),
    }).omit({ tokenVersion: true }),
})

export type AuthResponse = z.infer<typeof AuthResponse>

export const AuthSignInBody = z.object({
    phone: Phone.optional(),
    email: Email.optional(),
    password: AuthPassword,
})

export type AuthSignInBody = z.infer<typeof AuthSignInBody>

export const AuthCompanyAdminSignUpBody = z.object({
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
})

export type AuthGoogleBody = z.infer<typeof AuthGoogleBody>

export const AuthFacebookBody = z.object({
    accessToken: z.string(),
    idToken: z.string(),
})

export type AuthFacebookBody = z.infer<typeof AuthFacebookBody>
