import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../user/type.js'

export async function findAllByUserId(userId: AuthUserId) {
    return db
        .selectFrom('auth.user_device')
        .selectAll()
        .select('publicId as id')
        .where('userId', '=', userId)
        .execute()
}
