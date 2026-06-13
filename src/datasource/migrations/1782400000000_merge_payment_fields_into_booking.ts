import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE booking.booking
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES organization.bus_company(id),
            ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
            ADD COLUMN IF NOT EXISTS payment_method TEXT,
            ADD COLUMN IF NOT EXISTS payment_status TEXT,
            ADD COLUMN IF NOT EXISTS transaction_code TEXT,
            ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS pay_date TEXT,
            ADD COLUMN IF NOT EXISTS transaction_no TEXT;

        -- Drop the separate payment table as we are consolidating to 1 table (booking)
        DROP TABLE IF EXISTS payment.payment CASCADE;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        -- Recreate basic payment table (without full history for simplicity)
        CREATE TABLE IF NOT EXISTS payment.payment (
            id BIGSERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES organization.bus_company(id),
            coupon_id INTEGER REFERENCES booking.coupon(id),
            amount NUMERIC NOT NULL,
            method TEXT,
            status TEXT NOT NULL,
            transaction_code TEXT,
            paid_at TIMESTAMP,
            pay_date TEXT,
            transaction_no TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now()
        );

        ALTER TABLE booking.booking
            DROP COLUMN IF EXISTS transaction_no,
            DROP COLUMN IF EXISTS pay_date,
            DROP COLUMN IF EXISTS paid_at,
            DROP COLUMN IF EXISTS transaction_code,
            DROP COLUMN IF EXISTS payment_status,
            DROP COLUMN IF EXISTS payment_method,
            DROP COLUMN IF EXISTS payment_amount,
            DROP COLUMN IF EXISTS company_id;
    `.execute(db)
}
