import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ALTER COLUMN status TYPE SMALLINT
            USING CASE WHEN status::text = 'active' THEN 1 ELSE 0 END,
            ALTER COLUMN status SET NOT NULL;

        ALTER TABLE auth.user
            ADD CONSTRAINT user_status_flag_check
            CHECK (status IN (0, 1));

        DROP TYPE auth.user_status;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            DROP CONSTRAINT IF EXISTS user_status_flag_check,
            ALTER COLUMN status TYPE TEXT
            USING CASE WHEN status = 1 THEN 'active' ELSE 'inactive' END;

        CREATE TYPE auth.user_status AS ENUM ('active', 'inactive', 'banned');

        ALTER TABLE auth.user
            ALTER COLUMN status TYPE auth.user_status
            USING status::auth.user_status;
    `.execute(db)
}
