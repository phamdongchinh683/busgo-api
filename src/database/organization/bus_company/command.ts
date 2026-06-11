import { OrganizationBusCompanyTableInsert, OrganizationBusCompanyTableUpdate } from './table.js'
import { db } from '../../../datasource/db.js'
import { Transaction } from 'kysely'
import { OrganizationBusCompanyId } from './type.js'
import { Database } from '../../../datasource/type.js'

export async function upsertOne(
    params: OrganizationBusCompanyTableInsert,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .insertInto('organization.bus_company')
        .values(params)
        .onConflict(oc => oc.columns(['name', 'hotline']).doUpdateSet(params))
        .returningAll()
        .returning(['id as internalId', 'publicId as id'])
        .executeTakeFirstOrThrow()
}

export async function updateOne(
    id: OrganizationBusCompanyId,
    params: OrganizationBusCompanyTableUpdate,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('organization.bus_company')
        .set(params)
        .where('id', '=', id)
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function deleteOne(id: OrganizationBusCompanyId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .deleteFrom('organization.bus_company')
        .where('id', '=', id)
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function getOne(id: OrganizationBusCompanyId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('organization.bus_company')
        .selectAll()
        .select('publicId as id')
        .where('id', '=', id)
        .executeTakeFirstOrThrow()
}
