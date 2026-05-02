import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
    CREATE SCHEMA IF NOT EXISTS chat;

    CREATE TABLE chat.box (
        id SERIAL PRIMARY KEY,
        user_ids TEXT NOT NULL,
        title VARCHAR(255),
        created_by INT NOT NULL REFERENCES auth.user (id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE chat.message (
        id SERIAL PRIMARY KEY,
        box_id INT NOT NULL REFERENCES chat.box (id) ON DELETE CASCADE,
        sender_id INT NOT NULL REFERENCES auth.user (id),
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX chat_box_created_by_created_at_idx
    ON chat.box (created_by, created_at DESC, id);
    CREATE UNIQUE INDEX chat_box_user_ids_uidx
    ON chat.box (user_ids);

    CREATE INDEX chat_message_box_id_created_at_idx
    ON chat.message (box_id, created_at DESC, id);

    CREATE INDEX chat_message_sender_id_created_at_idx
    ON chat.message (sender_id, created_at DESC, id);

    CREATE TRIGGER box_set_timestamps
    BEFORE INSERT OR UPDATE ON chat.box
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamps();

    CREATE TRIGGER message_set_timestamps
    BEFORE INSERT OR UPDATE ON chat.message
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamps();
`

const DOWN = sql`
    DROP TRIGGER IF EXISTS message_set_timestamps ON chat.message;
    DROP TRIGGER IF EXISTS box_set_timestamps ON chat.box;
    DROP TABLE IF EXISTS chat.message;
    DROP TABLE IF EXISTS chat.box;
    DROP SCHEMA IF EXISTS chat;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
