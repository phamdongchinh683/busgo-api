import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS booking.ticket_booking_id_status_idx;
        DROP INDEX IF EXISTS booking.ticket_trip_status_idx;

        ALTER TABLE booking.ticket
            ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;

        UPDATE booking.ticket
        SET checked_in_at = COALESCE(updated_at, created_at)
        WHERE status = 'checked_in';

        ALTER TABLE booking.ticket
            DROP COLUMN IF EXISTS status;

        DROP TYPE IF EXISTS booking.ticket_status;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TYPE booking.ticket_status AS ENUM (
            'reserved',
            'paid',
            'cancelled',
            'checked_in'
        );

        ALTER TABLE booking.ticket
            ADD COLUMN IF NOT EXISTS status booking.ticket_status;

        UPDATE booking.ticket
        SET status = CASE
            WHEN checked_in_at IS NOT NULL
                THEN 'checked_in'::booking.ticket_status
            ELSE
                'paid'::booking.ticket_status
        END;

        ALTER TABLE booking.ticket
            DROP COLUMN IF EXISTS checked_in_at;

        CREATE INDEX IF NOT EXISTS ticket_booking_id_status_idx
            ON booking.ticket (booking_id, status);

        CREATE INDEX IF NOT EXISTS ticket_trip_status_idx
            ON booking.ticket (trip_id, status);
    `.execute(db)
}
