import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE booking.promotion_new
			ALTER COLUMN start_date TYPE VARCHAR(5)
			USING CASE
				WHEN start_date IS NULL THEN NULL
				ELSE to_char(start_date, 'MM-DD')
			END,
			ALTER COLUMN end_date TYPE VARCHAR(5)
			USING CASE
				WHEN end_date IS NULL THEN NULL
				ELSE to_char(end_date, 'MM-DD')
			END;
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE booking.promotion_new
			ALTER COLUMN start_date TYPE TIMESTAMP
			USING CASE
				WHEN start_date IS NULL THEN NULL
				ELSE to_timestamp(
					concat(extract(year from current_date)::text, '-', start_date),
					'YYYY-MM-DD'
				)
			END,
			ALTER COLUMN end_date TYPE TIMESTAMP
			USING CASE
				WHEN end_date IS NULL THEN NULL
				ELSE to_timestamp(
					concat(extract(year from current_date)::text, '-', end_date),
					'YYYY-MM-DD'
				)
			END;
	`.execute(db)
}
