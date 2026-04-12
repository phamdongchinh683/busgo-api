import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { TripPriceTemplateFilter } from '../../../model/query/trip-price-template/index.js'
import { OperationTripPriceTemplateId } from './type.js'
import { OperationTripPriceTemplateTableUpdate } from './table.js'

export async function findAllByCompanyId(params: {
    q: TripPriceTemplateFilter
    companyId: OrganizationBusCompanyId
}) {
    const { q, companyId } = params
    return db
        .selectFrom('operation.trip_price_template as tpt')
        .innerJoin('operation.route as r', 'tpt.routeId', 'r.id')
        .innerJoin('operation.station as s', 'tpt.fromStationId', 's.id')
        .innerJoin('operation.station as s2', 'tpt.toStationId', 's2.id')
        .where('tpt.companyId', '=', companyId)
        .where(eb => {
            const cond = []
            cond.push(eb('tpt.companyId', '=', companyId))
            if (q.next) {
                cond.push(eb('tpt.id', '>', q.next))
            }
            return eb.and(cond)
        })
        .select([
            'tpt.id',
            'tpt.price',
            'tpt.status',
            'r.id as routeId',
            'r.fromLocation as routeFromLocation',
            'r.toLocation as routeToLocation',
            's.id as fromStationId',
            's.address as fromStationAddress',
            's.city as fromStationCity',
            's2.id as toStationId',
            's2.address as toStationAddress',
            's2.city as toStationCity',
        ])
        .limit(q.limit + 1)
        .orderBy('tpt.id')
        .execute()
}

export async function updateOneById(
    id: OperationTripPriceTemplateId,
    body: OperationTripPriceTemplateTableUpdate
) {
    return db
        .updateTable('operation.trip_price_template as tpt')
        .set(body)
        .where('tpt.id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}
