import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.notification
    ADD COLUMN IF NOT EXISTS data text;
`

const DOWN = sql`
ALTER TABLE auth.notification
    DROP COLUMN IF EXISTS data;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
