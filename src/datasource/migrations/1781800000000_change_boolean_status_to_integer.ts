import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE operation.trip_schedule
            ALTER COLUMN status TYPE SMALLINT
            USING CASE WHEN status IS TRUE THEN 1 ELSE 0 END,
            ALTER COLUMN status SET NOT NULL;

        ALTER TABLE operation.trip_schedule
            ADD CONSTRAINT trip_schedule_status_flag_check
            CHECK (status IN (0, 1));

        ALTER TABLE operation.trip_price_template
            ALTER COLUMN status TYPE SMALLINT
            USING CASE WHEN status IS TRUE THEN 1 ELSE 0 END,
            ALTER COLUMN status SET NOT NULL;

        ALTER TABLE operation.trip_price_template
            ADD CONSTRAINT trip_price_template_status_flag_check
            CHECK (status IN (0, 1));
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE operation.trip_schedule
            DROP CONSTRAINT IF EXISTS trip_schedule_status_flag_check,
            ALTER COLUMN status TYPE BOOLEAN
            USING status = 1,
            ALTER COLUMN status DROP NOT NULL;

        ALTER TABLE operation.trip_price_template
            DROP CONSTRAINT IF EXISTS trip_price_template_status_flag_check,
            ALTER COLUMN status TYPE BOOLEAN
            USING status = 1,
            ALTER COLUMN status DROP NOT NULL;
    `.execute(db)
}
