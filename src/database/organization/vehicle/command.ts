import { OrganizationVehicleId } from './type.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { OrganizationVehicleTableInsert, OrganizationVehicleTableUpdate } from './table.js'

export async function findById(id: OrganizationVehicleId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('organization.vehicle as v')
        .where('v.id', '=', id)
        .selectAll()
        .executeTakeFirstOrThrow()
}

export async function randomVehicle(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('organization.vehicle as v')
        .where(eb => {
            const cond = []
            cond.push(eb('v.companyId', '=', companyId))
            cond.push(eb('v.status', '=', 'active'))
            return eb.and(cond)
        })
        .orderBy(sql`RANDOM()`)
        .limit(1)
        .select('v.id')
        .executeTakeFirstOrThrow()
}

export async function createOrganizationVehicle(
    params: OrganizationVehicleTableInsert,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .insertInto('organization.vehicle')
        .values(params)
        .onConflict(oc => oc.column('plateNumber').doUpdateSet(params))
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function updateOrganizationVehicle(
    id: OrganizationVehicleId,
    params: OrganizationVehicleTableUpdate,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('organization.vehicle as v')
        .set(params)
        .where(eb => {
            const cond = []
            cond.push(eb('v.id', '=', id))
            if (params.companyId) {
                cond.push(eb('v.companyId', '=', params.companyId))
            }
            return eb.and(cond)
        })
        .returningAll()
        .returning('v.publicId as id')
        .executeTakeFirstOrThrow()
}
