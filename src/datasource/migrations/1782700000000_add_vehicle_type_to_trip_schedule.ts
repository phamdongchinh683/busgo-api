import { Kysely, sql } from 'kysely'

const UP = sql`
    ALTER TABLE operation.trip_schedule ADD COLUMN vehicle_type varchar(20);
`

const DOWN = sql`
    ALTER TABLE operation.trip_schedule DROP COLUMN vehicle_type;
`

export async function up(db: Kysely<any>): Promise<void> {
    await UP.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
    await DOWN.execute(db)
}