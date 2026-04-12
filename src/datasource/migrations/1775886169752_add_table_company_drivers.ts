import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	CREATE TABLE organization.company_driver (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
		company_id INT NOT NULL REFERENCES organization.bus_company (id) ON DELETE CASCADE,
		status auth.user_status NOT NULL DEFAULT 'active',
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	);

	CREATE INDEX company_drivers_user_id_idx ON organization.company_driver (user_id);
	CREATE INDEX company_drivers_company_id_idx ON organization.company_driver (company_id);
	CREATE UNIQUE INDEX company_drivers_user_id_company_id_uidx ON organization.company_driver (user_id, company_id);

	CREATE TRIGGER company_drivers_set_timestamps
	BEFORE INSERT OR UPDATE ON organization.company_drivers
	FOR EACH ROW
	EXECUTE FUNCTION set_timestamps();
`

const DOWN = sql`
	DROP TRIGGER IF EXISTS company_drivers_set_timestamps ON organization.company_drivers;
	DROP TABLE IF EXISTS organization.company_drivers;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
