import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	CREATE TABLE auth.user_device (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
		fcm_token VARCHAR(512) NOT NULL,
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	);

	CREATE INDEX user_device_user_id_idx ON auth.user_device (user_id);

	CREATE TRIGGER user_device_set_timestamps
	BEFORE INSERT OR UPDATE ON auth.user_device
	FOR EACH ROW
	EXECUTE FUNCTION set_timestamps();
`

const DOWN = sql`
	DROP TRIGGER IF EXISTS user_device_set_timestamps ON auth.user_device;
	DROP TABLE IF EXISTS auth.user_device;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
