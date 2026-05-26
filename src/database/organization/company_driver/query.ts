import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'

export async function getAuthContext(userId: AuthUserId) {
    return db
        .selectFrom('organization.company_driver as cd')
        .select(['cd.companyId'])
        .where('cd.userId', '=', userId)
        .executeTakeFirst()
}
