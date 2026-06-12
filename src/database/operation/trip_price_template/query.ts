import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { TripPriceTemplateFilter } from '../../../model/query/trip-price-template/index.js'
import { OperationTripPriceTemplateId } from './type.js'
import { OperationTripPriceTemplateTableUpdate } from './table.js'
import { OperationRouteId } from '../route/type.js'

export async function findAllByCompanyId(params: {
    q: TripPriceTemplateFilter
    companyId: OrganizationBusCompanyId
    routeId?: OperationRouteId
}) {
    const { q, companyId, routeId } = params
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
            if (routeId) {
                cond.push(eb('r.id', '=', routeId))
            }
            return eb.and(cond)
        })
        .select([
            'tpt.id as cursorId',
            'tpt.publicId as id',
            'tpt.price',
            'tpt.status',
            'r.publicId as routeId',
            'r.fromLocation as routeFromLocation',
            'r.toLocation as routeToLocation',
            's.publicId as fromStationId',
            's.address as fromStationAddress',
            's.city as fromStationCity',
            's2.publicId as toStationId',
            's2.address as toStationAddress',
            's2.city as toStationCity',
        ])
        .limit(q.limit + 1)
        .orderBy('tpt.id')
        .execute()
}

export async function getPublicById(id: OperationTripPriceTemplateId) {
    return db
        .selectFrom('operation.trip_price_template as tpt')
        .innerJoin('operation.route as r', 'r.id', 'tpt.routeId')
        .innerJoin('operation.station as fromStation', 'fromStation.id', 'tpt.fromStationId')
        .innerJoin('operation.station as toStation', 'toStation.id', 'tpt.toStationId')
        .select([
            'tpt.publicId as id',
            'r.publicId as routeId',
            'fromStation.publicId as fromStationId',
            'toStation.publicId as toStationId',
            'tpt.price',
            'tpt.status',
        ])
        .where('tpt.id', '=', id)
        .executeTakeFirstOrThrow()
}

export async function updateOneById(
    id: OperationTripPriceTemplateId,
    body: OperationTripPriceTemplateTableUpdate
) {
    return db
        .updateTable('operation.trip_price_template as tpt')
        .set(body)
        .where(eb => {
            const cond = [eb('tpt.id', '=', id)]
            if (body.companyId) {
                cond.push(eb('tpt.companyId', '=', body.companyId))
            }
            return eb.and(cond)
        })
        .returningAll()
        .returning(['id as internalId', 'publicId as id'])
        .executeTakeFirstOrThrow()
}
