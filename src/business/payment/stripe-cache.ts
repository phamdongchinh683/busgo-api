import { AuthUserRole } from '../../database/auth/user/type.js'
import type { UserInfo } from '../../model/common.js'
import { utils } from '../../utils/index.js'

export type StripeCacheOwner = Pick<UserInfo, 'id' | 'role' | 'accountStripeId'>

export function stripeCachePayload(userInfo: StripeCacheOwner) {
    if (userInfo.role === AuthUserRole.enum.super_admin || !userInfo.accountStripeId) {
        return {
            scope: 'user',
            userId: userInfo.id,
        }
    }

    return {
        scope: 'account',
        accountStripeId: userInfo.accountStripeId,
    }
}

export function stripeCacheKey(prefix: string, userInfo: StripeCacheOwner) {
    return utils.cache.cacheKey(prefix, stripeCachePayload(userInfo))
}
