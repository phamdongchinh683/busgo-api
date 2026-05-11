import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE INDEX IF NOT EXISTS trip_status_departure_date_idx
            ON operation.trip (status, departure_date);

        CREATE INDEX IF NOT EXISTS trip_schedule_departure_date_idx
            ON operation.trip (schedule_id, departure_date);

        CREATE INDEX IF NOT EXISTS trip_driver_status_departure_date_idx
            ON operation.trip (driver_id, status, departure_date);

        CREATE INDEX IF NOT EXISTS ticket_trip_status_idx
            ON booking.ticket (trip_id, status);

        CREATE INDEX IF NOT EXISTS payment_booking_status_method_idx
            ON payment.payment (booking_id, status, method);

        CREATE INDEX IF NOT EXISTS notification_user_id_data_idx
            ON auth.notification (user_id, data);

        CREATE INDEX IF NOT EXISTS booking_status_created_at_idx
            ON booking.booking (status, created_at);
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP INDEX IF EXISTS booking_status_created_at_idx;
        DROP INDEX IF EXISTS notification_user_id_data_idx;
        DROP INDEX IF EXISTS payment_booking_status_method_idx;
        DROP INDEX IF EXISTS ticket_trip_status_idx;
        DROP INDEX IF EXISTS trip_driver_status_departure_date_idx;
        DROP INDEX IF EXISTS trip_schedule_departure_date_idx;
        DROP INDEX IF EXISTS trip_status_departure_date_idx;
    `.execute(db)
}
