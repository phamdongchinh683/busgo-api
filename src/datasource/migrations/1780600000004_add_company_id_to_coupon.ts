import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	ALTER TABLE booking.coupon
		ADD COLUMN IF NOT EXISTS company_id INT REFERENCES organization.bus_company (id);

	CREATE INDEX IF NOT EXISTS coupon_company_id_idx
		ON booking.coupon (company_id);
`

const DOWN = sql`
	DROP INDEX IF EXISTS coupon_company_id_idx;

	ALTER TABLE booking.coupon
		DROP COLUMN IF EXISTS company_id;
`

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
