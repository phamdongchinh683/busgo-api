import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { sql, Transaction } from 'kysely'
import { OrganizationDriverMonthlyStatInsert } from './table.js'
import { Database } from '../../../datasource/type.js'

export async function upsertDriverMonthlyStat(
    params: {
        driverId: AuthUserId
        year: number
        month: number
        type: 'completed' | 'cancelled'
    },
    trx?: Transaction<Database>
) {
    const { driverId, year, month, type } = params

    return (trx ?? db)
        .insertInto('organization.driver_monthly_stat')
        .values({
            driverId,
            year,
            month,
            completedTripCount: type === 'completed' ? 1 : 0,
            cancelledTripCount: type === 'cancelled' ? 1 : 0,
        })
        .onConflict(oc =>
            oc.columns(['driverId', 'year', 'month']).doUpdateSet({
                completedTripCount:
                    type === 'completed'
                        ? sql`"organization"."driver_monthly_stat"."completed_trip_count" + 1`
                        : sql`"organization"."driver_monthly_stat"."completed_trip_count"`,

                cancelledTripCount:
                    type === 'cancelled'
                        ? sql`"organization"."driver_monthly_stat"."cancelled_trip_count" + 1`
                        : sql`"organization"."driver_monthly_stat"."cancelled_trip_count"`,
            })
        )
        .executeTakeFirstOrThrow()
}

export async function upsertOne(
    OrgDriverMonthlyStat: OrganizationDriverMonthlyStatInsert,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .insertInto('organization.driver_monthly_stat')
        .values(OrgDriverMonthlyStat)
        .onConflict(oc =>
            oc.columns(['driverId', 'year', 'month']).doUpdateSet({
                driverId: OrgDriverMonthlyStat.driverId,
            })
        )
        .returningAll()
        .executeTakeFirstOrThrow()
}
