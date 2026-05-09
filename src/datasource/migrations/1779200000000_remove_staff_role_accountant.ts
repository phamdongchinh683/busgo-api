import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	UPDATE auth.staff_profile
	SET role = 'company_admin'::auth.staff_role
	WHERE role::text = 'accountant';

	ALTER TYPE auth.staff_role RENAME TO staff_role_old;
	CREATE TYPE auth.staff_role AS ENUM ('operator', 'support', 'company_admin');
	ALTER TABLE auth.staff_profile
		ALTER COLUMN role TYPE auth.staff_role
		USING role::text::auth.staff_role;
	DROP TYPE auth.staff_role_old;
`

const DOWN = sql`
	ALTER TYPE auth.staff_role RENAME TO staff_role_old;
	CREATE TYPE auth.staff_role AS ENUM ('operator', 'accountant', 'support', 'company_admin');
	ALTER TABLE auth.staff_profile
		ALTER COLUMN role TYPE auth.staff_role
		USING role::text::auth.staff_role;
	DROP TYPE auth.staff_role_old;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
