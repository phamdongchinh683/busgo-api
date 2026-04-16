import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE organization.company_driver
    DROP COLUMN IF EXISTS status;
`

const DOWN = sql`
ALTER TABLE organization.company_driver
    ADD COLUMN IF NOT EXISTS status auth.user_status NOT NULL DEFAULT 'active';
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
