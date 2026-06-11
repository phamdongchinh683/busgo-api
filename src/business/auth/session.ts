import { jwt } from '../../app/index.js'
import { AuthOperatorRole, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import type { AuthResponse } from '../../model/body/auth/index.js'

type AuthUser = NonNullable<Awaited<ReturnType<typeof dal.auth.user.query.getAuthUser>>>

async function getAuthContext(user: AuthUser) {
    if (AuthOperatorRole.safeParse(user.role).success || user.role === AuthUserRole.enum.driver) {
        const membership = await dal.organization.companyMember.query.getAuthContext(user.id)
        return {
            companyId: membership?.companyId ?? null,
            driverCompanyId:
                user.role === AuthUserRole.enum.driver ? (membership?.companyId ?? null) : null,
        }
    }

    return {
        companyId: null,
        driverCompanyId: null,
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
        companyId: context.companyId,
        status: user.status,
        accountStripeId: user.accountStripeId,
        lastChangeEmail: user.lastChangeEmail,
        lastChangePhone: user.lastChangePhone,
    }

    const responseUser = {
        id: tokenPayload.id,
        publicId: user.publicId,
        email: tokenPayload.email,
        phone: tokenPayload.phone,
        role: tokenPayload.role,
        fullName: tokenPayload.fullName,
        companyId: tokenPayload.companyId,
        facebookId: tokenPayload.facebookId,
        googleId: tokenPayload.googleId,
        status: tokenPayload.status,
        accountStripeId: tokenPayload.accountStripeId,
        lastChangeEmail: tokenPayload.lastChangeEmail,
        lastChangePhone: tokenPayload.lastChangePhone,
        driverCompanyId: context.driverCompanyId,
    }

    return {
        message: 'Thành công',
        token: jwt.auth.generateToken(tokenPayload),
        user: responseUser,
    }
}
