import { AuthUserId } from '../../auth/user/type.js'
import { utils } from '../../../utils/index.js'
import { db } from '../../../datasource/db.js'

export async function getDriverStats(params: {
    driverId: AuthUserId
    year?: number
    month?: number
}) {
    const now = utils.time.getNow()

    const year = params.year ?? now.year()
    const month = params.month ?? now.month() + 1

    return db
        .selectFrom('organization.driver_monthly_stat')
        .where(eb => {
            const cond = []
            cond.push(eb('driverId', '=', params.driverId))
            cond.push(eb('year', '=', year))
            cond.push(eb('month', '=', month))
            return eb.and(cond)
        })
        .selectAll()
        .executeTakeFirst()
}

export async function getStatsByDriverId(id: AuthUserId) {
    const now = utils.time.getNow()

    return db
        .selectFrom('organization.driver_monthly_stat')
        .where(eb => {
            const cond = []
            cond.push(eb('driverId', '=', id))
            cond.push(eb('year', '=', now.year()))
            return eb.and(cond)
        })
        .selectAll()
        .execute()
}
