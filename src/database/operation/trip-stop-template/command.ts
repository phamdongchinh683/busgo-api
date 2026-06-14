import { Transaction } from 'kysely'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { OperationRouteId } from '../route/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { OperationTripStopTemplateTableInsert } from './table.js'
import _ from 'lodash'

export async function findAllByScheduleId(
    params: {
        scheduleId: OperationTripScheduleId
        routeId: OperationRouteId
        companyId: OrganizationBusCompanyId
    },
    trx?: Transaction<Database>
) {
    const { scheduleId, routeId, companyId } = params
    return (trx ?? db)
        .selectFrom('operation.trip_stop_template as tst')
        .where(eb => {
            const cond = []
            cond.push(eb('tst.scheduleId', '=', scheduleId))
            cond.push(eb('tst.routeId', '=', routeId))
            cond.push(eb('tst.companyId', '=', companyId))
            return eb.and(cond)
        })
        .selectAll()
        .execute()
}

export async function createOne(
    params: OperationTripStopTemplateTableInsert,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as OperationTripStopTemplateTableInsert

    return (trx ?? db)
        .insertInto('operation.trip_stop_template')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow()
}
