import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE organization.bus_company_review
    DROP CONSTRAINT IF EXISTS bus_company_review_company_id_user_id_key,
    DROP CONSTRAINT IF EXISTS bus_company_review_company_user_uidx;

DROP INDEX IF EXISTS organization.bus_company_review_company_id_user_id_key;
DROP INDEX IF EXISTS organization.bus_company_review_company_user_uidx;
`

const DOWN = sql`
CREATE UNIQUE INDEX IF NOT EXISTS bus_company_review_company_user_uidx
    ON organization.bus_company_review (company_id, user_id);
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
