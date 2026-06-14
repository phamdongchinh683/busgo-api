import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
            RENAME COLUMN star_1 TO star1;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star_2 TO star2;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star_3 TO star3;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star_4 TO star4;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star_5 TO star5;
		ALTER TABLE organization.bus_company
				DROP COLUMN review_count;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
            RENAME COLUMN star1 TO star_1;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star2 TO star_2;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star3 TO star_3;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star4 TO star_4;

        ALTER TABLE organization.bus_company
            RENAME COLUMN star5 TO star_5;
    `.execute(db)
}
