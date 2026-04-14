import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
	ALTER TABLE auth.staff_profile
		ADD COLUMN IF NOT EXISTS company_id INT REFERENCES organization.bus_company (id),
		ADD COLUMN IF NOT EXISTS staff_code VARCHAR(30),
		ADD COLUMN IF NOT EXISTS position VARCHAR(100),
		ADD COLUMN IF NOT EXISTS department VARCHAR(100),
		ADD COLUMN IF NOT EXISTS identity_number VARCHAR(50),
		ADD COLUMN IF NOT EXISTS hire_date DATE,
		ADD COLUMN IF NOT EXISTS status auth.user_status;

	UPDATE auth.staff_profile sp
	SET
		company_id = sd.company_id,
		staff_code = sd.staff_code,
		position = sd.position,
		department = sd.department,
		identity_number = sd.identity_number,
		hire_date = sd.hire_date,
		status = sd.status
	FROM auth.staff_detail sd
	WHERE sd.user_id = sp.user_id;

	CREATE INDEX IF NOT EXISTS staff_profile_company_id_idx
		ON auth.staff_profile (company_id);
	CREATE INDEX IF NOT EXISTS staff_profile_status_idx
		ON auth.staff_profile (status);
`

const DOWN = sql`
	DROP INDEX IF EXISTS staff_profile_status_idx;
	DROP INDEX IF EXISTS staff_profile_company_id_idx;

	ALTER TABLE auth.staff_profile
		DROP COLUMN IF EXISTS status,
		DROP COLUMN IF EXISTS hire_date,
		DROP COLUMN IF EXISTS identity_number,
		DROP COLUMN IF EXISTS email,
		DROP COLUMN IF EXISTS phone,
		DROP COLUMN IF EXISTS department,
		DROP COLUMN IF EXISTS position,
		DROP COLUMN IF EXISTS staff_code,
		DROP COLUMN IF EXISTS company_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
