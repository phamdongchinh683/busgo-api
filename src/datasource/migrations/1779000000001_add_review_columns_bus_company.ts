import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE organization.bus_company
    ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS review_avg_stars NUMERIC(3,1) NOT NULL DEFAULT 0;
`

const DOWN = sql`
ALTER TABLE organization.bus_company
    DROP COLUMN IF EXISTS review_avg_stars,
    DROP COLUMN IF EXISTS review_count;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
