import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user_otp
    ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;
`

const DOWN = sql`
ALTER TABLE auth.user_otp
    DROP COLUMN IF EXISTS verified;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
