import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE INDEX IF NOT EXISTS booking_status_expired_at_idx
            ON booking.booking (status, expired_at);
        CREATE INDEX IF NOT EXISTS ticket_booking_id_status_idx
            ON booking.ticket (booking_id, status);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS booking_status_expired_at_idx;
        DROP INDEX IF EXISTS ticket_booking_id_status_idx;
    `.execute(db)
}
