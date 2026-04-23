import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
        ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "long" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE organization.bus_company
        DROP COLUMN IF EXISTS lat,
        DROP COLUMN IF EXISTS "long";
    `.execute(db)
}
