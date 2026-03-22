import { db } from '../../../datasource/db.js'
import { RouteFilter } from '../../../model/query/route/index.js'

export async function findAll(filter: RouteFilter) {
    return db
        .selectFrom('operation.route as r')
        .where(eb => {
            const cond = []
            if (filter.next) {
                cond.push(eb('r.id', '>', filter.next))
            }
            return eb.and(cond)
        })
        .selectAll()
        .limit(filter.limit + 1)
        .orderBy('r.id')
        .execute()
}
