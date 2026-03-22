import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE operation.route
			ADD CONSTRAINT route_unique_from_to_location
			UNIQUE (from_location, to_location);
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE operation.route
			DROP CONSTRAINT IF EXISTS route_unique_from_to_location;
	`.execute(db)
}
