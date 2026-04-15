import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	ALTER TYPE auth.user_role RENAME TO user_role_old;
	CREATE TYPE auth.user_role AS ENUM ('admin', 'driver', 'customer', 'super_admin');
	ALTER TABLE auth.user
		ALTER COLUMN role TYPE auth.user_role
		USING role::text::auth.user_role;
	DROP TYPE auth.user_role_old;

	UPDATE auth.user u
	SET role = 'super_admin'
	FROM auth.staff_profile sp
	WHERE sp.user_id = u.id
		AND sp.role::text = 'super_admin';

	ALTER TYPE auth.staff_role RENAME TO staff_role_old;
	CREATE TYPE auth.staff_role AS ENUM ('operator', 'accountant', 'support', 'company_admin');
	ALTER TABLE auth.staff_profile
		ALTER COLUMN role TYPE auth.staff_role
		USING (
			CASE
				WHEN role::text = 'super_admin' THEN NULL
				ELSE role::text::auth.staff_role
			END
		);
	DROP TYPE auth.staff_role_old;
`

const DOWN = sql`
	ALTER TYPE auth.staff_role RENAME TO staff_role_old;
	CREATE TYPE auth.staff_role AS ENUM (
		'super_admin',
		'operator',
		'accountant',
		'support',
		'company_admin'
	);
	ALTER TABLE auth.staff_profile
		ALTER COLUMN role TYPE auth.staff_role
		USING role::text::auth.staff_role;
	DROP TYPE auth.staff_role_old;

	UPDATE auth.staff_profile sp
	SET role = 'super_admin'
	FROM auth.user u
	WHERE sp.user_id = u.id
		AND u.role::text = 'super_admin';

	ALTER TYPE auth.user_role RENAME TO user_role_old;
	CREATE TYPE auth.user_role AS ENUM ('admin', 'driver', 'customer');
	ALTER TABLE auth.user
		ALTER COLUMN role TYPE auth.user_role
		USING (
			CASE
				WHEN role::text = 'super_admin' THEN 'admin'::auth.user_role
				ELSE role::text::auth.user_role
			END
		);
	DROP TYPE auth.user_role_old;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
