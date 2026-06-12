import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { OperationStationId } from '../station/type.js'
import { OperationTripPriceTemplateTableInsert } from './table.js'
import _ from 'lodash'
import { TripPriceTemplateFilter } from '../../../model/query/trip-price-template/index.js'
import { OperationTripPriceTemplateId } from './type.js'

export async function findAllPriceByScheduleId(params: {
    q: TripPriceTemplateFilter
    companyId: OrganizationBusCompanyId
}) {
    const { q, companyId } = params
    return db
        .selectFrom('operation.trip_price_template as tpt')
        .where(eb => {
            const cond = []
            cond.push(eb('tpt.companyId', '=', companyId))

            if (q.next) {
                cond.push(eb('tpt.id', '>', q.next))
            }
            return eb.and(cond)
        })
        .selectAll()
        .limit(q.limit + 1)
        .orderBy('tpt.id')
        .execute()
}

export async function getPriceByCompanyId(
    params: {
        companyId: OrganizationBusCompanyId
        fromStationId: OperationStationId
        toStationId: OperationStationId
    },
    trx?: Transaction<Database>
) {
    const { companyId, fromStationId, toStationId } = params
    return (trx ?? db)
        .selectFrom('operation.trip_price_template as tpt')
        .where(eb =>
            eb.and([
                eb('tpt.companyId', '=', companyId),
                eb('tpt.fromStationId', '=', fromStationId),
                eb('tpt.toStationId', '=', toStationId),
            ])
        )
        .select(['tpt.price'])
        .executeTakeFirst()
}

export async function createOne(
    params: OperationTripPriceTemplateTableInsert,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as OperationTripPriceTemplateTableInsert
    return (trx ?? db)
        .insertInto('operation.trip_price_template')
        .values(data)
        .onConflict(oc =>
            oc.columns(['companyId', 'routeId', 'fromStationId', 'toStationId']).doUpdateSet(data)
        )
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function deleteOneById(
    id: OperationTripPriceTemplateId,
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .deleteFrom('operation.trip_price_template')
        .where('id', '=', id)
        .where('companyId', '=', companyId)
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}
