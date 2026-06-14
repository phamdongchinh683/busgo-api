import { sql, type Kysely } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
	ALTER TABLE auth."user"
DROP COLUMN IF EXISTS full_name;`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {}
