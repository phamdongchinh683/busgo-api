import { Kysely, sql } from 'kysely'
import { Database } from '../type.js'

export async function up(db: Kysely<Database>): Promise<void> {
    // 1. Tạo bảng organization.company_review
    await db.schema
        .withSchema('organization')
        .createTable('company_review')
        .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
        .addColumn('company_id', 'integer', col =>
            col.references('organization.bus_company.id').notNull().onDelete('cascade')
        )
        .addColumn('user_id', 'integer', col =>
            col.references('auth.user.id').notNull().onDelete('cascade')
        )
        .addColumn('ticket_id', 'integer', col =>
            col.references('booking.ticket.id').notNull().onDelete('cascade').unique()
        )
        .addColumn('rating', 'integer', col => col.notNull())
        .addColumn('comment', 'text')
        .addColumn('reply', 'text')
        .addColumn('status', 'varchar', col => col.defaultTo('published').notNull())
        .addColumn('created_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
        .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
        .execute()

    // 2. Thêm trường cache vào bảng bus_company
    await db.schema
        .withSchema('organization')
        .alterTable('bus_company')
        .addColumn('average_rating', 'numeric(3, 2)', col => col.defaultTo(0).notNull())
        .addColumn('total_reviews', 'integer', col => col.defaultTo(0).notNull())
        .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
    // 1. Xoá trường cache khỏi bảng bus_company
    await db.schema
        .withSchema('organization')
        .alterTable('bus_company')
        .dropColumn('average_rating')
        .dropColumn('total_reviews')
        .execute()

    // 2. Xoá bảng company_review
    await db.schema.withSchema('organization').dropTable('company_review').execute()
}
