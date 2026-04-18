import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'payment'
          AND t.typname = 'payment_method'
          AND e.enumlabel = 'stripe'
    ) THEN
        ALTER TYPE payment.payment_method ADD VALUE 'stripe';
    END IF;
END $$;
`

const DOWN = sql`
-- PostgreSQL does not support dropping a single enum value safely.
-- Keep down migration as no-op.
SELECT 1;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
