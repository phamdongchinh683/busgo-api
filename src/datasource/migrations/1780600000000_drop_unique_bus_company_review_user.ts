import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE organization.bus_company_review
    DROP CONSTRAINT IF EXISTS bus_company_review_company_id_user_id_key;
`

const DOWN = sql`
ALTER TABLE organization.bus_company_review
    ADD CONSTRAINT bus_company_review_company_id_user_id_key UNIQUE (company_id, user_id);
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
