import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE payment.payment
            ADD COLUMN IF NOT EXISTS coupon_id INTEGER
                REFERENCES booking.coupon (id);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE payment.payment
            DROP COLUMN IF EXISTS coupon_id;
    `.execute(db)
}
