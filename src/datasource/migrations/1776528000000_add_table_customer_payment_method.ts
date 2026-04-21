import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
CREATE TABLE IF NOT EXISTS payment.customer_payment_method (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES auth.user (id),
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    brand VARCHAR(50),
    last4 VARCHAR(4),
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (stripe_payment_method_id)
);

CREATE INDEX IF NOT EXISTS customer_payment_method_user_id_idx
    ON payment.customer_payment_method (user_id);
`

const DOWN = sql`
DROP TABLE IF EXISTS payment.customer_payment_method;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
