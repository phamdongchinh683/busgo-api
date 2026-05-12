import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
		CREATE SEQUENCE IF NOT EXISTS operation.trip_stop_template_id_seq;

		ALTER TABLE operation.trip_stop_template
			ALTER COLUMN id SET DEFAULT nextval('operation.trip_stop_template_id_seq');

		SELECT setval(
			'operation.trip_stop_template_id_seq',
			COALESCE((SELECT MAX(id) FROM operation.trip_stop_template), 0) + 1,
			false
		);
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE operation.trip_stop_template
			ALTER COLUMN id DROP DEFAULT;

		DROP SEQUENCE IF EXISTS operation.trip_stop_template_id_seq;
	`.execute(db)
}
