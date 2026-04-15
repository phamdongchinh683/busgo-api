import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
CREATE UNIQUE INDEX IF NOT EXISTS user_device_fcm_token_uidx ON auth.user_device (fcm_token);
`

const DOWN = sql`
DROP INDEX IF EXISTS auth.user_device_fcm_token_uidx;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
