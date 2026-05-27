import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE organization.bus_company_review
    ADD COLUMN IF NOT EXISTS ticket_id INT not NULL REFERENCES booking.ticket (id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS bus_company_review_company_user_ticket_uidx
    ON organization.bus_company_review (company_id, user_id, ticket_id);
`

const DOWN = sql`
DROP INDEX IF EXISTS organization.bus_company_review_company_user_ticket_uidx;

ALTER TABLE organization.bus_company_review
    DROP COLUMN IF EXISTS ticket_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
