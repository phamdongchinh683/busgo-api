import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UPDATE_PENDING_COUPON_USAGE = sql`
    UPDATE booking.coupon AS c
    SET used_quantity = COALESCE(c.used_quantity, 0) + pending_booking.quantity
    FROM (
        SELECT coupon_id, COUNT(*)::int AS quantity
        FROM booking.booking
        WHERE status = 'pending'
            AND coupon_id IS NOT NULL
        GROUP BY coupon_id
    ) AS pending_booking
    WHERE c.id = pending_booking.coupon_id;
`

const REVERT_PENDING_COUPON_USAGE = sql`
    UPDATE booking.coupon AS c
    SET used_quantity = GREATEST(COALESCE(c.used_quantity, 0) - pending_booking.quantity, 0)
    FROM (
        SELECT coupon_id, COUNT(*)::int AS quantity
        FROM booking.booking
        WHERE status = 'pending'
            AND coupon_id IS NOT NULL
        GROUP BY coupon_id
    ) AS pending_booking
    WHERE c.id = pending_booking.coupon_id;
`

// `any` is required here since migrations should be frozen in time.
export async function up(db: Kysely<any>): Promise<void> {
    await UPDATE_PENDING_COUPON_USAGE.execute(db)
}

// `any` is required here since migrations should be frozen in time.
export async function down(db: Kysely<any>): Promise<void> {
    await REVERT_PENDING_COUPON_USAGE.execute(db)
}
