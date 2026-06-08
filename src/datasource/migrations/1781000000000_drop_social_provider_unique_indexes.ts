import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
DROP INDEX IF EXISTS auth.user_google_id_uidx;
`

const DOWN = sql`
CREATE UNIQUE INDEX IF NOT EXISTS user_google_id_uidx ON auth.user (google_id);
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
