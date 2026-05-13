import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	DROP SCHEMA IF EXISTS audit CASCADE;
`

const DOWN = sql`
	CREATE SCHEMA IF NOT EXISTS audit;
`

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
