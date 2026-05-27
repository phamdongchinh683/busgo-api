import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS bus_company_name_trgm_idx
    ON organization.bus_company
    USING gin (name gin_trgm_ops);
`

const DOWN = sql`
DROP INDEX IF EXISTS organization.bus_company_name_trgm_idx;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
