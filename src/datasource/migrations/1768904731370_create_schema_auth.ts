import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	CREATE SCHEMA IF NOT EXISTS auth;

	CREATE TYPE auth.user_role AS ENUM ('admin', 'driver', 'customer');
	CREATE TYPE auth.user_status AS ENUM ('active', 'inactive', 'banned');
	CREATE TYPE auth.staff_role AS ENUM (
		'super_admin',
		'operator',
		'accountant',
		'support',
		'company_admin'
	);

	CREATE TABLE auth.user (
		id SERIAL PRIMARY KEY,
		password VARCHAR(255) NOT NULL,
		full_name VARCHAR(100),
		email VARCHAR(100),
		phone VARCHAR(20),
		role auth.user_role,
		status auth.user_status,
		created_at TIMESTAMP,
		update_at TIMESTAMP
	);

	CREATE INDEX user_email_idx ON auth.user (email);
	CREATE INDEX user_phone_idx ON auth.user (phone);
	CREATE INDEX user_role_idx ON auth.user (role);
	CREATE INDEX user_status_idx ON auth.user (status);

	CREATE TABLE auth.staff_profile (
		id SERIAL PRIMARY KEY,
		user_id INT REFERENCES auth.user (id) ON DELETE CASCADE,
		role auth.staff_role,
		created_at TIMESTAMP
	);

	CREATE INDEX staff_profile_user_id_idx ON auth.staff_profile (user_id);
	CREATE INDEX staff_profile_role_idx ON auth.staff_profile (role);
`

const DOWN = sql`
	DROP SCHEMA IF EXISTS auth CASCADE;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
