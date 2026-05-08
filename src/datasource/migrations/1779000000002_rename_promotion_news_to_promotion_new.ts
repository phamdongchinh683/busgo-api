import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'booking'
          AND table_name = 'promotion_news'
    ) THEN
        ALTER TABLE booking.promotion_news RENAME TO promotion_new;
    END IF;
END $$;
`

const DOWN = sql`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'booking'
          AND table_name = 'promotion_new'
    ) THEN
        ALTER TABLE booking.promotion_new RENAME TO promotion_news;
    END IF;
END $$;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}

