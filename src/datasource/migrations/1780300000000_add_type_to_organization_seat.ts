import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
    ALTER TABLE organization.seat
        ADD COLUMN IF NOT EXISTS type SMALLINT NOT NULL DEFAULT 1;

    WITH ranked_seats AS (
        SELECT
            id,
            row_number() OVER (PARTITION BY vehicle_id ORDER BY id) AS row_number,
            count(*) OVER (PARTITION BY vehicle_id) AS total_count
        FROM organization.seat
    )
    UPDATE organization.seat AS s
    SET type = CASE
        WHEN ranked_seats.row_number <= ranked_seats.total_count / 2 THEN 1
        ELSE 2
    END
    FROM ranked_seats
    WHERE ranked_seats.id = s.id;

    ALTER TABLE organization.seat
        DROP CONSTRAINT IF EXISTS seat_type_check;

    ALTER TABLE organization.seat
        ADD CONSTRAINT seat_type_check CHECK (type IN (1, 2));

    CREATE INDEX IF NOT EXISTS seat_vehicle_type_number_idx
        ON organization.seat (vehicle_id, type, seat_number);
`

const DOWN = sql`
    DROP INDEX IF EXISTS organization.seat_vehicle_type_number_idx;

    ALTER TABLE organization.seat
        DROP CONSTRAINT IF EXISTS seat_type_check;

    ALTER TABLE organization.seat
        DROP COLUMN IF EXISTS type;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
