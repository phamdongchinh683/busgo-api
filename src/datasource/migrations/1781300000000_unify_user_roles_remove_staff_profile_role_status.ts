import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ALTER COLUMN role TYPE TEXT
            USING role::text;

        UPDATE auth.user u
        SET role = CASE sp.role::text
            WHEN 'company_admin' THEN 'operator_admin'
            WHEN 'support' THEN 'operator_support'
            WHEN 'dispatcher' THEN 'operator_dispatcher'
            ELSE 'operator_dispatcher'
        END
        FROM auth.staff_profile sp
        WHERE sp.user_id = u.id
            AND u.role = 'operator';

        UPDATE auth.user
        SET role = 'operator_dispatcher'
        WHERE role = 'operator';

        DROP TYPE auth.user_role;
        CREATE TYPE auth.user_role AS ENUM (
            'operator_admin',
            'operator_support',
            'operator_dispatcher',
            'driver',
            'customer',
            'super_admin'
        );

        ALTER TABLE auth.user
            ALTER COLUMN role TYPE auth.user_role
            USING role::auth.user_role;

        DROP INDEX IF EXISTS auth.staff_profile_role_company_user_idx;
        DROP INDEX IF EXISTS auth.staff_profile_status_idx;
        DROP INDEX IF EXISTS auth.staff_profile_role_idx;

        ALTER TABLE auth.staff_profile
            DROP COLUMN IF EXISTS role,
            DROP COLUMN IF EXISTS status;

        DROP TYPE IF EXISTS auth.staff_role;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TYPE auth.staff_role AS ENUM ('dispatcher', 'support', 'company_admin');

        ALTER TABLE auth.staff_profile
            ADD COLUMN role auth.staff_role,
            ADD COLUMN status auth.user_status;

        UPDATE auth.staff_profile sp
        SET
            role = CASE u.role::text
                WHEN 'operator_admin' THEN 'company_admin'::auth.staff_role
                WHEN 'operator_support' THEN 'support'::auth.staff_role
                WHEN 'operator_dispatcher' THEN 'dispatcher'::auth.staff_role
                ELSE NULL
            END,
            status = u.status
        FROM auth.user u
        WHERE u.id = sp.user_id;

        CREATE INDEX staff_profile_role_idx ON auth.staff_profile (role);
        CREATE INDEX staff_profile_status_idx ON auth.staff_profile (status);
        CREATE INDEX staff_profile_role_company_user_idx
            ON auth.staff_profile (role, company_id, user_id);

        ALTER TABLE auth.user
            ALTER COLUMN role TYPE TEXT
            USING role::text;

        UPDATE auth.user
        SET role = 'operator'
        WHERE role IN ('operator_admin', 'operator_support', 'operator_dispatcher');

        DROP TYPE auth.user_role;
        CREATE TYPE auth.user_role AS ENUM ('operator', 'driver', 'customer', 'super_admin');

        ALTER TABLE auth.user
            ALTER COLUMN role TYPE auth.user_role
            USING role::auth.user_role;
    `.execute(db)
}
