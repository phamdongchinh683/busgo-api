import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE auth.user
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS user_google_id_uidx ON auth.user (google_id);
`

const DOWN = sql`
DROP INDEX IF EXISTS auth.user_google_id_uidx;

ALTER TABLE auth.user
    DROP COLUMN IF EXISTS google_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
