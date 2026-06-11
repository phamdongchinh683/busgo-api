import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        DO $$
        BEGIN
            IF EXISTS (
                SELECT user_id
                FROM (
                    SELECT user_id, company_id
                    FROM auth.staff_profile
                    WHERE company_id IS NOT NULL
                    UNION ALL
                    SELECT user_id, company_id
                    FROM organization.company_driver
                ) memberships
                GROUP BY user_id
                HAVING COUNT(DISTINCT company_id) > 1
            ) THEN
                RAISE EXCEPTION 'A user belongs to multiple companies. Resolve memberships before migrating.';
            END IF;
        END $$;

        CREATE TABLE organization.company_member (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
            company_id INT NOT NULL REFERENCES organization.bus_company (id) ON DELETE CASCADE,
            staff_code VARCHAR(30),
            position VARCHAR(100),
            department VARCHAR(100),
            identity_number VARCHAR(50),
            hire_date DATE,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );

        CREATE UNIQUE INDEX company_member_user_id_uidx
            ON organization.company_member (user_id);
        CREATE INDEX company_member_company_id_id_idx
            ON organization.company_member (company_id, id);
        CREATE INDEX company_member_company_staff_code_idx
            ON organization.company_member (company_id, staff_code)
            WHERE staff_code IS NOT NULL;

        CREATE TRIGGER company_member_set_timestamps
            BEFORE INSERT OR UPDATE ON organization.company_member
            FOR EACH ROW
            EXECUTE FUNCTION set_timestamps();

        INSERT INTO organization.company_member (
            user_id,
            company_id,
            staff_code,
            position,
            department,
            identity_number,
            hire_date,
            created_at,
            updated_at
        )
        SELECT
            user_id,
            company_id,
            staff_code,
            position,
            department,
            identity_number,
            hire_date,
            created_at,
            updated_at
        FROM auth.staff_profile
        WHERE company_id IS NOT NULL
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO organization.company_member (user_id, company_id, created_at, updated_at)
        SELECT user_id, company_id, created_at, updated_at
        FROM organization.company_driver
        ON CONFLICT (user_id) DO NOTHING;

        DROP TABLE auth.staff_profile;
        DROP TABLE organization.company_driver;
        DROP TABLE IF EXISTS auth.staff_detail;
    `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TABLE auth.staff_profile (
            id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES auth.user (id) ON DELETE CASCADE,
            company_id INT REFERENCES organization.bus_company (id),
            staff_code VARCHAR(30),
            position VARCHAR(100),
            department VARCHAR(100),
            identity_number VARCHAR(50),
            hire_date DATE,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );

        CREATE INDEX staff_profile_user_id_idx ON auth.staff_profile (user_id);
        CREATE INDEX staff_profile_company_id_id_idx ON auth.staff_profile (company_id, id);
        CREATE TRIGGER staff_profile_set_timestamps
            BEFORE INSERT OR UPDATE ON auth.staff_profile
            FOR EACH ROW
            EXECUTE FUNCTION set_timestamps();

        INSERT INTO auth.staff_profile (
            user_id,
            company_id,
            staff_code,
            position,
            department,
            identity_number,
            hire_date,
            created_at,
            updated_at
        )
        SELECT DISTINCT ON (cm.user_id)
            cm.user_id,
            cm.company_id,
            cm.staff_code,
            cm.position,
            cm.department,
            cm.identity_number,
            cm.hire_date,
            cm.created_at,
            cm.updated_at
        FROM organization.company_member cm
        INNER JOIN auth.user u ON u.id = cm.user_id
        WHERE u.role::text IN ('operator_admin', 'operator_support', 'operator_dispatcher')
        ORDER BY cm.user_id, cm.company_id;

        CREATE TABLE organization.company_driver (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES auth.user (id) ON DELETE CASCADE,
            company_id INT NOT NULL REFERENCES organization.bus_company (id) ON DELETE CASCADE,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );

        CREATE INDEX company_drivers_user_id_idx ON organization.company_driver (user_id);
        CREATE INDEX company_drivers_company_id_idx ON organization.company_driver (company_id);
        CREATE UNIQUE INDEX company_drivers_user_id_company_id_uidx
            ON organization.company_driver (user_id, company_id);
        CREATE TRIGGER company_drivers_set_timestamps
            BEFORE INSERT OR UPDATE ON organization.company_driver
            FOR EACH ROW
            EXECUTE FUNCTION set_timestamps();

        INSERT INTO organization.company_driver (user_id, company_id, created_at, updated_at)
        SELECT cm.user_id, cm.company_id, cm.created_at, cm.updated_at
        FROM organization.company_member cm
        INNER JOIN auth.user u ON u.id = cm.user_id
        WHERE u.role::text = 'driver';

        DROP TABLE organization.company_member;
    `.execute(db)
}
