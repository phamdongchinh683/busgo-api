import { jwt } from '../../app/index.js'
import { AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import type { AuthResponse } from '../../model/body/auth/index.js'

type AuthUser = NonNullable<Awaited<ReturnType<typeof dal.auth.user.query.getAuthUser>>>

async function getAuthContext(user: AuthUser) {
    if (user.role === AuthUserRole.enum.operator) {
        const staffProfile = await dal.auth.staffProfile.query.getAuthContext(user.id)
        return {
            companyId: staffProfile?.companyId ?? null,
            driverCompanyId: null,
            staffProfileRole: staffProfile?.staffProfileRole ?? null,
        }
    }

    if (user.role === AuthUserRole.enum.driver) {
        const driver = await dal.organization.companyDriver.query.getAuthContext(user.id)
        return {
            companyId: driver?.companyId ?? null,
            driverCompanyId: driver?.companyId ?? null,
            staffProfileRole: null,
        }
    }

    return {
        companyId: null,
        driverCompanyId: null,
        staffProfileRole: null,
    }
}

export async function buildAuthResponse(user: AuthUser): Promise<AuthResponse> {
    const context = await getAuthContext(user)
    const tokenPayload = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName,
        googleId: user.googleId,
        facebookId: user.facebookId,
        tokenVersion: user.tokenVersion,
        staffProfileRole: context.staffProfileRole,
        companyId: context.companyId,
        status: user.status,
        accountStripeId: user.accountStripeId,
        lastChangeEmail: user.lastChangeEmail,
        lastChangePhone: user.lastChangePhone,
    }

    return {
        message: 'Thành công',
        token: jwt.auth.generateToken(tokenPayload),
        user: {
            id: tokenPayload.id,
            email: tokenPayload.email,
            phone: tokenPayload.phone,
            role: tokenPayload.role,
            fullName: tokenPayload.fullName,
            staffProfileRole: tokenPayload.staffProfileRole,
            companyId: tokenPayload.companyId,
            facebookId: tokenPayload.facebookId,
            googleId: tokenPayload.googleId,
            status: tokenPayload.status,
            accountStripeId: tokenPayload.accountStripeId,
            lastChangeEmail: tokenPayload.lastChangeEmail,
            lastChangePhone: tokenPayload.lastChangePhone,
            driverCompanyId: context.driverCompanyId,
        },
    }
}
