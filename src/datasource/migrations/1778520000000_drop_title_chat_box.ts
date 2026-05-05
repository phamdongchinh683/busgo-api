import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
ALTER TABLE chat.box
    DROP COLUMN IF EXISTS title;
`

const DOWN = sql`
ALTER TABLE chat.box
    ADD COLUMN IF NOT EXISTS title VARCHAR(255);
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
