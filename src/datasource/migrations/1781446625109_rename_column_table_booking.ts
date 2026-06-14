import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE booking.booking
        RENAME COLUMN payment_method TO method;

        ALTER TABLE booking.booking
        RENAME COLUMN payment_status TO status;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        ALTER TABLE booking.booking
        RENAME COLUMN method TO payment_method;

        ALTER TABLE booking.booking
        RENAME COLUMN status TO payment_status;
    `.execute(db)
}
