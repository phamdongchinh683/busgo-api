import type { Kysely } from 'kysely'
import { sql } from 'kysely'

const UP = sql`
CREATE TABLE IF NOT EXISTS organization.bus_company_review (
    id BIGSERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES organization.bus_company (id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS bus_company_review_company_id_idx
    ON organization.bus_company_review (company_id);

CREATE INDEX IF NOT EXISTS bus_company_review_company_id_rating_idx
    ON organization.bus_company_review (company_id, rating);

DROP TRIGGER IF EXISTS bus_company_review_set_timestamps ON organization.bus_company_review;
CREATE TRIGGER bus_company_review_set_timestamps
BEFORE INSERT OR UPDATE ON organization.bus_company_review
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();

CREATE TABLE IF NOT EXISTS booking.promotion_new (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by INT REFERENCES auth.user (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    update_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS promotion_news_is_active_start_date_end_date_idx
    ON booking.promotion_new (is_active, start_date, end_date);

DROP TRIGGER IF EXISTS promotion_news_set_timestamps ON booking.promotion_new;
CREATE TRIGGER promotion_news_set_timestamps
BEFORE INSERT OR UPDATE ON booking.promotion_new
FOR EACH ROW
EXECUTE FUNCTION set_timestamps();
`

const DOWN = sql`
DROP TRIGGER IF EXISTS promotion_news_set_timestamps ON booking.promotion_new;
DROP INDEX IF EXISTS promotion_news_is_active_start_date_end_date_idx;
DROP TABLE IF EXISTS booking.promotion_new;

DROP TRIGGER IF EXISTS bus_company_review_set_timestamps ON organization.bus_company_review;
DROP INDEX IF EXISTS bus_company_review_company_id_rating_idx;
DROP INDEX IF EXISTS bus_company_review_company_id_idx;
DROP TABLE IF EXISTS organization.bus_company_review;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}
