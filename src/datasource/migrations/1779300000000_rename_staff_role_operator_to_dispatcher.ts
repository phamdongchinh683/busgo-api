import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.staff_role RENAME VALUE 'operator' TO 'dispatcher'`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`ALTER TYPE auth.staff_role RENAME VALUE 'dispatcher' TO 'operator'`.execute(db)
}
