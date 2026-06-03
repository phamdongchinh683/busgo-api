import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS facebook_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false,
    ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_facebook_id_uidx ON auth.user (facebook_id);
`

const DOWN = sql`
DROP INDEX IF EXISTS auth.user_facebook_id_uidx;

ALTER TABLE auth.user
    DROP COLUMN IF EXISTS is_email_verified,
    DROP COLUMN IF EXISTS facebook_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
