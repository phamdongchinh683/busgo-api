import { Database } from '../../../datasource/type.js'
import { OrganizationCompanyDriverTableInsert } from './table.js'
import { Transaction } from 'kysely'
import { db } from '../../../datasource/db.js'

export async function insertOne(
    params: OrganizationCompanyDriverTableInsert,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .insertInto('organization.company_driver')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}
