import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
        ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
        DROP COLUMN IF EXISTS address;
    `.execute(db)
}
