import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
                    ORDER BY id ASC
                ) AS rn
            FROM chat.box
        )
        DELETE FROM chat.box AS b
        USING ranked AS r
        WHERE b.id = r.id
          AND r.rn > 1;

        CREATE UNIQUE INDEX IF NOT EXISTS chat_box_unique_pair
        ON chat.box (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP INDEX IF EXISTS chat.chat_box_unique_pair`.execute(db)
}
