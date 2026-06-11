import { Transaction } from 'kysely'
import { db } from '../../../datasource/db.js'
import { OperationStationTableInsert } from './table.js'
import { Database } from '../../../datasource/type.js'
import _ from 'lodash'

export async function upsertOne(params: OperationStationTableInsert, trx?: Transaction<Database>) {
    const data = _.omitBy(params, v => _.isNil(v)) as OperationStationTableInsert
    return (trx ?? db)
        .insertInto('operation.station')
        .values(data)
        .onConflict(oc => oc.columns(['companyId', 'address', 'city']).doUpdateSet(data))
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}
