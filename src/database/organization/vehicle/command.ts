import { OrganizationVehicleId } from './type.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { OrganizationVehicleTableInsert, OrganizationVehicleTableUpdate } from './table.js'
import { HttpErr } from '../../../app/index.js'

export async function findById(
    id: OrganizationVehicleId,
    companyId?: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('organization.vehicle as v')
        .where('v.id', '=', id)
        .$if(Boolean(companyId), qb => qb.where('v.companyId', '=', companyId!))
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
    const vehicle = await (trx ?? db)
        .insertInto('organization.vehicle')
        .values(params)
        .onConflict(oc => oc.column('plateNumber').doNothing())
        .returningAll()
        .returning('id')
        .executeTakeFirst()

    if (!vehicle) {
        throw new HttpErr.UnprocessableEntity('Biển số xe đã tồn tại.', 'VEHICLE_ALREADY_EXISTS')
    }

    return vehicle
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
        .returning('v.id')
        .executeTakeFirstOrThrow()
}
