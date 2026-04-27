import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.user_role RENAME VALUE 'admin' TO 'agent'`.execute(db)

    await sql`
        ALTER TYPE auth.staff_role RENAME TO staff_role_old;
        CREATE TYPE auth.staff_role AS ENUM ('operator', 'accountant', 'support', 'company_admin');

        ALTER TABLE auth.staff_profile
            ALTER COLUMN role TYPE auth.staff_role
            USING (
                CASE
                    WHEN role::text = 'driver' THEN NULL
                    WHEN role::text = 'super_admin' THEN NULL
                    ELSE role::text::auth.staff_role
                END
            );

        DROP TYPE auth.staff_role_old;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.user_role RENAME VALUE 'agent' TO 'admin'`.execute(db)

    await sql`
        ALTER TYPE auth.staff_role RENAME TO staff_role_old;
        CREATE TYPE auth.staff_role AS ENUM ('operator', 'accountant', 'support', 'company_admin', 'driver');

        ALTER TABLE auth.staff_profile
            ALTER COLUMN role TYPE auth.staff_role
            USING role::text::auth.staff_role;

        DROP TYPE auth.staff_role_old;
    `.execute(db)
}
