import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE payment.payment
            DROP COLUMN IF EXISTS booking_id;

        ALTER TABLE payment.payment
            ADD COLUMN IF NOT EXISTS company_id INTEGER
                REFERENCES organization.bus_company (id);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE payment.payment
            DROP COLUMN IF EXISTS company_id;

        ALTER TABLE payment.payment
            ADD COLUMN IF NOT EXISTS booking_id INTEGER
                REFERENCES booking.booking (id);
    `.execute(db)
}
