import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ALTER COLUMN role TYPE TEXT
            USING role::text;

        UPDATE auth.user
        SET role = 'operator'
        WHERE role IN ('operator_admin', 'operator_support', 'operator_dispatcher');

        DROP TYPE auth.user_role;
        CREATE TYPE auth.user_role AS ENUM (
            'operator',
            'driver',
            'customer',
            'super_admin'
        );

        ALTER TABLE auth.user
            ALTER COLUMN role TYPE auth.user_role
            USING role::auth.user_role;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ALTER COLUMN role TYPE TEXT
            USING role::text;

        UPDATE auth.user
        SET role = 'operator_admin'
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
    `.execute(db)
}
