import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
            ADD COLUMN IF NOT EXISTS star_1 INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS star_2 INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS star_3 INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS star_4 INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS star_5 INTEGER NOT NULL DEFAULT 0;

        UPDATE organization.bus_company AS bc
        SET
            star_1 = COALESCE(sub.c1, 0),
            star_2 = COALESCE(sub.c2, 0),
            star_3 = COALESCE(sub.c3, 0),
            star_4 = COALESCE(sub.c4, 0),
            star_5 = COALESCE(sub.c5, 0),
            review_count = COALESCE(sub.total, bc.review_count)
        FROM (
            SELECT
                company_id,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE rating = 1) AS c1,
                COUNT(*) FILTER (WHERE rating = 2) AS c2,
                COUNT(*) FILTER (WHERE rating = 3) AS c3,
                COUNT(*) FILTER (WHERE rating = 4) AS c4,
                COUNT(*) FILTER (WHERE rating = 5) AS c5
            FROM organization.bus_company_review
            GROUP BY company_id
        ) AS sub
        WHERE bc.id = sub.company_id;

        ALTER TABLE organization.bus_company
            DROP COLUMN IF EXISTS review_avg_stars;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
            ADD COLUMN IF NOT EXISTS review_avg_stars NUMERIC(3,1) NOT NULL DEFAULT 0;

        ALTER TABLE organization.bus_company
            DROP COLUMN IF EXISTS star_5,
            DROP COLUMN IF EXISTS star_4,
            DROP COLUMN IF EXISTS star_3,
            DROP COLUMN IF EXISTS star_2,
            DROP COLUMN IF EXISTS star_1;
    `.execute(db)
}
