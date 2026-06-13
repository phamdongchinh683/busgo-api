import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const PUBLIC_TABLES = [
    ['auth', 'user', 'auth_user_public_id_uidx'],
    ['auth', 'user_device', 'auth_user_device_public_id_uidx'],
    ['auth', 'notification', 'auth_notification_public_id_uidx'],
    ['booking', 'booking', 'booking_public_id_uidx'],
    ['booking', 'coupon', 'coupon_public_id_uidx'],
    ['organization', 'bus_company', 'bus_company_public_id_uidx'],
    ['organization', 'bus_company_review', 'bus_company_review_public_id_uidx'],
    ['organization', 'company_member', 'company_member_public_id_uidx'],
    ['organization', 'seat', 'seat_public_id_uidx'],
    ['organization', 'vehicle', 'vehicle_public_id_uidx'],
    ['operation', 'route', 'route_public_id_uidx'],
    ['operation', 'station', 'station_public_id_uidx'],
    ['operation', 'trip_schedule', 'trip_schedule_public_id_uidx'],
    ['operation', 'trip_stop_template', 'trip_stop_template_public_id_uidx'],
    ['operation', 'trip', 'trip_public_id_uidx'],
    ['operation', 'trip_price_template', 'trip_price_template_public_id_uidx'],
    ['booking', 'ticket', 'ticket_public_id_uidx'],
    ['booking', 'promotion_new', 'promotion_new_public_id_uidx'],
    ['chat', 'box', 'chat_box_public_id_uidx'],
    ['chat', 'message', 'chat_message_public_id_uidx'],
    ['payment', 'customer_payment_method', 'customer_payment_method_public_id_uidx'],
] as const

export async function up(db: Kysely<any>): Promise<void> {
    for (const [schema, table, index] of [...PUBLIC_TABLES].reverse()) {
        await sql`
            DROP INDEX IF EXISTS ${sql.id(index)};
            ALTER TABLE ${sql.table(`${schema}.${table}`)}
                DROP COLUMN IF EXISTS public_id;
        `.execute(db)
    }
}

export async function down(db: Kysely<any>): Promise<void> {
    for (const [schema, table, index] of PUBLIC_TABLES) {
        await sql`
            ALTER TABLE ${sql.table(`${schema}.${table}`)}
                ADD COLUMN public_id UUID DEFAULT gen_random_uuid();

            ALTER TABLE ${sql.table(`${schema}.${table}`)}
                ALTER COLUMN public_id SET NOT NULL;

            CREATE UNIQUE INDEX ${sql.id(index)}
                ON ${sql.table(`${schema}.${table}`)} (public_id);
        `.execute(db)
    }
}
