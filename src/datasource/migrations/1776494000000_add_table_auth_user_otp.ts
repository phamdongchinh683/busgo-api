import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	CREATE TABLE IF NOT EXISTS auth.user_otp (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255),
		phone VARCHAR(20),
		otp VARCHAR(32) NOT NULL,
		expires_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE UNIQUE INDEX IF NOT EXISTS user_otp_email_unique_idx ON auth.user_otp (email);
	CREATE UNIQUE INDEX IF NOT EXISTS user_otp_phone_unique_idx ON auth.user_otp (phone);
	CREATE INDEX IF NOT EXISTS user_otp_expires_at_idx ON auth.user_otp (expires_at);
`

const DOWN = sql`
	DROP INDEX IF EXISTS user_otp_phone_unique_idx;
	DROP INDEX IF EXISTS user_otp_email_unique_idx;
	DROP INDEX IF EXISTS user_otp_expires_at_idx;
	DROP TABLE IF EXISTS auth.user_otp;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
