import { CamelCasePlugin, DeduplicateJoinsPlugin, Kysely, PostgresDialect } from 'kysely'
import { Pool, type PoolConfig, types } from 'pg'

import { Database } from './type.js'

import 'dotenv/config'

const toNumber = (v: null | string) => (v ? +v : null)

types.setTypeParser(types.builtins.INT2, toNumber)
types.setTypeParser(types.builtins.INT4, toNumber)
types.setTypeParser(types.builtins.INT8, toNumber)
types.setTypeParser(types.builtins.FLOAT4, toNumber)
types.setTypeParser(types.builtins.FLOAT8, toNumber)
types.setTypeParser(types.builtins.NUMERIC, toNumber)

const poolConfig: PoolConfig = {
    connectionString: process.env.DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}

if (process.env.APP_ENV === 'local') {
    poolConfig.ssl = false
} else if (process.env.APP_ENV !== 'local') {
    poolConfig.ssl = {
        rejectUnauthorized: false,
    }
}

const pool = new Pool(poolConfig)

const dialect = new PostgresDialect({ pool })

export const db = new Kysely<Database>({
    dialect,
    log(event) {
        if (event.level === 'error') {
            console.error('Query failed : ', {
                durationMs: event.queryDurationMillis,
                error: event.error,
                params: event.query.parameters,
                sql: event.query.sql,
            })
            return
        }
        if (process.env.APP_ENV === 'production') {
            return
        }
        console.log('Query executed : ', {
            durationMs: event.queryDurationMillis,
            params: event.query.parameters,
            sql: event.query.sql,
        })
    },
    plugins: [new CamelCasePlugin(), new DeduplicateJoinsPlugin()],
})
