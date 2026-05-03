import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES auth.user (id);

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS receiver_id INTEGER REFERENCES auth.user (id);

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS sender_message_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS receiver_message_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS unread_receiver_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS unread_sender_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS last_message_sender_id INTEGER REFERENCES auth.user (id);
`

const DOWN = sql`
ALTER TABLE chat.box
    DROP COLUMN IF EXISTS last_message_sender_id;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS unread_sender_count;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS unread_receiver_count;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS receiver_message_count;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS sender_message_count;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS receiver_id;

ALTER TABLE chat.box
    DROP COLUMN IF EXISTS sender_id;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
