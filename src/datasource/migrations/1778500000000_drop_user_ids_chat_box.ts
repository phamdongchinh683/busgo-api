import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
DROP INDEX IF EXISTS chat.chat_box_user_ids_uidx;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS user_ids;
`

const DOWN = sql`
ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS user_ids TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS chat_box_user_ids_uidx
    ON chat.box (user_ids);
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
