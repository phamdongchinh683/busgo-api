import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE operation.trip
            ADD COLUMN IF NOT EXISTS driver_ids INT[];

        UPDATE operation.trip
        SET driver_ids = ARRAY[driver_id]::int[]
        WHERE driver_id IS NOT NULL
            AND driver_ids IS NULL;

        DROP INDEX IF EXISTS operation.trip_driver_status_departure_date_idx;
        DROP INDEX IF EXISTS operation.trip_driver_id_idx;

        ALTER TABLE operation.trip
            DROP COLUMN IF EXISTS driver_id;

        CREATE INDEX IF NOT EXISTS trip_driver_ids_gin_idx
            ON operation.trip USING GIN (driver_ids);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE operation.trip
            ADD COLUMN IF NOT EXISTS driver_id INT REFERENCES auth.user (id);

        UPDATE operation.trip
        SET driver_id = driver_ids[1]
        WHERE driver_ids IS NOT NULL
            AND array_length(driver_ids, 1) > 0;

        DROP INDEX IF EXISTS operation.trip_driver_ids_gin_idx;

        ALTER TABLE operation.trip
            DROP COLUMN IF EXISTS driver_ids;

        CREATE INDEX IF NOT EXISTS trip_driver_id_idx
            ON operation.trip (driver_id);

        CREATE INDEX IF NOT EXISTS trip_driver_status_departure_date_idx
            ON operation.trip (driver_id, status, departure_date);
    `.execute(db)
}
