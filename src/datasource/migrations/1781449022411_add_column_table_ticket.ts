import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TYPE booking.ticket_status AS ENUM (
            'active',
            'checked_in',
            'completed',
            'cancelled'
        );

        ALTER TABLE booking.ticket
        ADD COLUMN status booking.ticket_status
        NOT NULL DEFAULT 'active';
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE booking.ticket
        DROP COLUMN IF EXISTS status;

        DROP TYPE IF EXISTS booking.ticket_status;
    `.execute(db)
}
