import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.user_role RENAME VALUE 'agent' TO 'operator'`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.user_role RENAME VALUE 'operator' TO 'agent'`.execute(db)
}
