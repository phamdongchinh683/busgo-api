import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	ALTER TABLE organization.company_driver
	ADD COLUMN total_completed_trips INT DEFAULT 0 NOT NULL;
`

const DOWN = sql`
	ALTER TABLE organization.company_driver
	DROP COLUMN IF EXISTS total_completed_trips;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
