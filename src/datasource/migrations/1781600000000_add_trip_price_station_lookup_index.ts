import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE INDEX IF NOT EXISTS trip_price_template_company_stations_idx
            ON operation.trip_price_template (company_id, from_station_id, to_station_id);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS operation.trip_price_template_company_stations_idx;
    `.execute(db)
}
