import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
    CREATE INDEX IF NOT EXISTS trip_schedule_company_status_departure_id_idx
        ON operation.trip_schedule (company_id, status, departure_time, id);

    CREATE INDEX IF NOT EXISTS trip_schedule_route_status_dates_id_idx
        ON operation.trip_schedule (route_id, status, start_date, end_date, id);

    CREATE INDEX IF NOT EXISTS trip_stop_template_schedule_order_idx
        ON operation.trip_stop_template (schedule_id, stop_order);

    CREATE INDEX IF NOT EXISTS trip_stop_template_schedule_route_company_idx
        ON operation.trip_stop_template (schedule_id, route_id, company_id);

    CREATE INDEX IF NOT EXISTS trip_stop_template_pickup_idx
        ON operation.trip_stop_template (schedule_id, stop_order)
        WHERE allow_pickup = true;

    CREATE INDEX IF NOT EXISTS trip_stop_template_dropoff_idx
        ON operation.trip_stop_template (schedule_id, stop_order)
        WHERE allow_dropoff = true;

    CREATE INDEX IF NOT EXISTS trip_price_template_company_id_idx
        ON operation.trip_price_template (company_id, id);

    CREATE INDEX IF NOT EXISTS trip_price_template_company_route_id_idx
        ON operation.trip_price_template (company_id, route_id, id);

    CREATE INDEX IF NOT EXISTS station_company_id_id_idx
        ON operation.station (company_id, id);

    CREATE INDEX IF NOT EXISTS station_company_city_id_idx
        ON operation.station (company_id, city, id);

    CREATE INDEX IF NOT EXISTS vehicle_company_id_id_idx
        ON organization.vehicle (company_id, id);

    CREATE INDEX IF NOT EXISTS vehicle_company_status_id_idx
        ON organization.vehicle (company_id, status, id);

    CREATE INDEX IF NOT EXISTS vehicle_company_type_id_idx
        ON organization.vehicle (company_id, type, id);

    CREATE INDEX IF NOT EXISTS company_driver_company_user_idx
        ON organization.company_driver (company_id, user_id);

    CREATE INDEX IF NOT EXISTS staff_profile_company_id_id_idx
        ON auth.staff_profile (company_id, id);

    CREATE INDEX IF NOT EXISTS staff_profile_role_company_user_idx
        ON auth.staff_profile (role, company_id, user_id);

    CREATE INDEX IF NOT EXISTS user_role_status_id_idx
        ON auth.user (role, status, id);

    CREATE INDEX IF NOT EXISTS payment_paid_at_status_method_idx
        ON payment.payment (paid_at, status, method);

    CREATE INDEX IF NOT EXISTS booking_created_at_status_idx
        ON booking.booking (created_at, status);
`

const DOWN = sql`
    DROP INDEX IF EXISTS booking.booking_created_at_status_idx;
    DROP INDEX IF EXISTS payment.payment_paid_at_status_method_idx;
    DROP INDEX IF EXISTS auth.user_role_status_id_idx;
    DROP INDEX IF EXISTS auth.staff_profile_role_company_user_idx;
    DROP INDEX IF EXISTS auth.staff_profile_company_id_id_idx;
    DROP INDEX IF EXISTS organization.company_driver_company_user_idx;
    DROP INDEX IF EXISTS organization.vehicle_company_type_id_idx;
    DROP INDEX IF EXISTS organization.vehicle_company_status_id_idx;
    DROP INDEX IF EXISTS organization.vehicle_company_id_id_idx;
    DROP INDEX IF EXISTS operation.station_company_city_id_idx;
    DROP INDEX IF EXISTS operation.station_company_id_id_idx;
    DROP INDEX IF EXISTS operation.trip_price_template_company_route_id_idx;
    DROP INDEX IF EXISTS operation.trip_price_template_company_id_idx;
    DROP INDEX IF EXISTS operation.trip_stop_template_dropoff_idx;
    DROP INDEX IF EXISTS operation.trip_stop_template_pickup_idx;
    DROP INDEX IF EXISTS operation.trip_stop_template_schedule_route_company_idx;
    DROP INDEX IF EXISTS operation.trip_stop_template_schedule_order_idx;
    DROP INDEX IF EXISTS operation.trip_schedule_route_status_dates_id_idx;
    DROP INDEX IF EXISTS operation.trip_schedule_company_status_departure_id_idx;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
