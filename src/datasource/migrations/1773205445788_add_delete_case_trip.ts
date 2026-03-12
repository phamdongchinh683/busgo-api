import type { Kysely } from 'kysely'
import { sql } from 'kysely'

// Add ON DELETE CASCADE to FKs referencing operation.trip (and seat_segment → ticket).
// `any` is required here since migrations should be frozen in time.
export async function up(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE booking.ticket DROP CONSTRAINT IF EXISTS ticket_trip_id_fkey;
		ALTER TABLE booking.ticket ADD CONSTRAINT ticket_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES operation.trip (id) ON DELETE CASCADE;
		ALTER TABLE booking.seat_segment DROP CONSTRAINT IF EXISTS seat_segment_trip_id_fkey;
		ALTER TABLE booking.seat_segment ADD CONSTRAINT seat_segment_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES operation.trip (id) ON DELETE CASCADE;
		ALTER TABLE booking.seat_segment DROP CONSTRAINT IF EXISTS seat_segment_ticket_id_fkey;
		ALTER TABLE booking.seat_segment ADD CONSTRAINT seat_segment_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES booking.ticket (id) ON DELETE CASCADE;
	`.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
		ALTER TABLE booking.ticket DROP CONSTRAINT IF EXISTS ticket_trip_id_fkey;
		ALTER TABLE booking.ticket ADD CONSTRAINT ticket_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES operation.trip (id);
		ALTER TABLE booking.seat_segment DROP CONSTRAINT IF EXISTS seat_segment_trip_id_fkey;
		ALTER TABLE booking.seat_segment ADD CONSTRAINT seat_segment_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES operation.trip (id);
		ALTER TABLE booking.seat_segment DROP CONSTRAINT IF EXISTS seat_segment_ticket_id_fkey;
		ALTER TABLE booking.seat_segment ADD CONSTRAINT seat_segment_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES booking.ticket (id);
	`.execute(db)
}
