import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
`

const DOWN = sql`
ALTER TABLE auth.user
    DROP COLUMN IF EXISTS token_version;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
