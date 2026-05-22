import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS auth.user_username_idx;
        ALTER TABLE auth.user
            DROP COLUMN IF EXISTS username;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ADD COLUMN IF NOT EXISTS username VARCHAR(50);
        ALTER TABLE auth.user
            ADD CONSTRAINT user_username_key UNIQUE (username);
        CREATE INDEX IF NOT EXISTS user_username_idx ON auth.user (username);
    `.execute(db)
}
