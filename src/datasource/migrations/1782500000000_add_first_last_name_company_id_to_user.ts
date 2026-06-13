import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES organization.bus_company (id);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE auth.user
            DROP COLUMN IF EXISTS company_id,
            DROP COLUMN IF EXISTS last_name,
            DROP COLUMN IF EXISTS first_name;
    `.execute(db)
}
