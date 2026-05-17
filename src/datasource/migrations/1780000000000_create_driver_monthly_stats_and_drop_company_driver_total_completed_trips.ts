import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
    CREATE TABLE IF NOT EXISTS organization.driver_monthly_stat (
        id SERIAL PRIMARY KEY,
        driver_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
        year INT NOT NULL,
        month INT NOT NULL CHECK (month >= 1 AND month <= 12),
        completed_trip_count INT NOT NULL DEFAULT 0 CHECK (completed_trip_count >= 0),
        cancelled_trip_count INT NOT NULL DEFAULT 0 CHECK (cancelled_trip_count >= 0),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS driver_monthly_stat_driver_year_month_uidx
        ON organization.driver_monthly_stat (driver_id, year, month);

    CREATE TRIGGER driver_monthly_stat_set_timestamps
        BEFORE INSERT OR UPDATE ON organization.driver_monthly_stat
        FOR EACH ROW
        EXECUTE FUNCTION set_timestamps();

    ALTER TABLE organization.company_driver
        DROP COLUMN IF EXISTS total_completed_trips;
`

const DOWN = sql`
    ALTER TABLE organization.company_driver
        ADD COLUMN IF NOT EXISTS total_completed_trips INT DEFAULT 0 NOT NULL;

    DROP TRIGGER IF EXISTS driver_monthly_stat_set_timestamps 
        ON organization.driver_monthly_stat;

    DROP TABLE IF EXISTS organization.driver_monthly_stat;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
