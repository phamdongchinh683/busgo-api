import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	CREATE TABLE IF NOT EXISTS auth.notification (
		id SERIAL PRIMARY KEY,
		user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
		title VARCHAR(255) NOT NULL,
		body TEXT NOT NULL,
		is_read BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS notification_user_id_idx
		ON auth.notification (user_id);

	CREATE INDEX IF NOT EXISTS notification_user_id_is_read_created_at_idx
		ON auth.notification (user_id, is_read, created_at DESC);

	CREATE TRIGGER notification_set_timestamps
	BEFORE INSERT OR UPDATE ON auth.notification
	FOR EACH ROW
	EXECUTE FUNCTION set_timestamps();
`

const DOWN = sql`
	DROP TRIGGER IF EXISTS notification_set_timestamps ON auth.notification;
	DROP INDEX IF EXISTS notification_user_id_is_read_created_at_idx;
	DROP INDEX IF EXISTS notification_user_id_idx;
	DROP TABLE IF EXISTS auth.notification;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
