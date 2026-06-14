import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        DROP TYPE IF EXISTS booking.booking_status;

        ALTER TABLE booking.booking
        RENAME COLUMN method TO payment_method;

        ALTER TABLE booking.booking
        RENAME COLUMN status TO payment_status;

        ALTER TABLE booking.ticket
        ADD COLUMN is_rate boolean;
    `.execute(db)
}
export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE booking.booking
        DROP COLUMN IF EXISTS is_rate;

        ALTER TABLE booking.booking
        RENAME COLUMN payment_status TO status;

        ALTER TABLE booking.booking
        RENAME COLUMN payment_method TO method;

        CREATE TYPE booking.booking_status AS ENUM (
            'pending',
            'confirmed',
            'cancelled',
            'completed'
        );
    `.execute(db)
}
