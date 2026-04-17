import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS account_stripe_id VARCHAR(255);
`

const DOWN = sql`
ALTER TABLE auth.user
    DROP COLUMN IF EXISTS account_stripe_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
