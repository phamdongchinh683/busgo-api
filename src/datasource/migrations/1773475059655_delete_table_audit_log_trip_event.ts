import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        DROP TABLE IF EXISTS audit.audit_log;
        DROP TABLE IF EXISTS operation.trip_event;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    // optional: leave empty or recreate tables if you need rollback
}
