import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
CREATE INDEX IF NOT EXISTS chat_box_sender_id_id_idx
    ON chat.box (sender_id, id ASC);

CREATE INDEX IF NOT EXISTS chat_box_receiver_id_id_idx
    ON chat.box (receiver_id, id ASC);
`

const DOWN = sql`
DROP INDEX IF EXISTS chat.chat_box_receiver_id_id_idx;

DROP INDEX IF EXISTS chat.chat_box_sender_id_id_idx;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
