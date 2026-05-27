import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS trip_schedule_departure_date_uidx
            ON operation.trip (schedule_id, departure_date);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS trip_schedule_departure_date_uidx;
    `.execute(db)
}
