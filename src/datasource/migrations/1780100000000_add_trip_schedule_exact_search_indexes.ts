import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE INDEX IF NOT EXISTS route_from_location_idx
            ON operation.route (from_location);

        CREATE INDEX IF NOT EXISTS route_to_location_idx
            ON operation.route (to_location);

        CREATE INDEX IF NOT EXISTS trip_schedule_status_dates_idx
            ON operation.trip_schedule (status, start_date, end_date);

        CREATE INDEX IF NOT EXISTS trip_schedule_status_departure_id_idx
            ON operation.trip_schedule (status, departure_time, id);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS trip_schedule_status_departure_id_idx;
        DROP INDEX IF EXISTS trip_schedule_status_dates_idx;
        DROP INDEX IF EXISTS route_to_location_idx;
        DROP INDEX IF EXISTS route_from_location_idx;
    `.execute(db)
}
