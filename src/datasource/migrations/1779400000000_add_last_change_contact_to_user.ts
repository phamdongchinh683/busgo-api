import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS last_change_contact TIMESTAMP NULL;
`

const DOWN = sql`
ALTER TABLE auth.user
    DROP COLUMN IF EXISTS last_change_contact;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
