import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
          AND table_name = 'user'
          AND column_name = 'last_change_contact'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
          AND table_name = 'user'
          AND column_name = 'last_change_email'
    ) THEN
        ALTER TABLE auth.user RENAME COLUMN last_change_contact TO last_change_email;
    END IF;
END $$;

ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS last_change_email TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS last_change_phone TIMESTAMP NULL;
`

const DOWN = sql`
ALTER TABLE auth.user
    DROP COLUMN IF EXISTS last_change_phone;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
          AND table_name = 'user'
          AND column_name = 'last_change_email'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'auth'
          AND table_name = 'user'
          AND column_name = 'last_change_contact'
    ) THEN
        ALTER TABLE auth.user RENAME COLUMN last_change_email TO last_change_contact;
    END IF;
END $$;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
