import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { CompanyAdminQuery } from '../../../model/query/company-admin/index.js'
import { AuthProfileQuery } from '../../../model/query/staff/index.js'
import { AuthOperatorRole, AuthUserId, AuthUserRole, OPERATOR_ROLES } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function getOne(params: { userId: AuthUserId; companyId?: OrganizationBusCompanyId }) {
    return db
        .selectFrom('organization.company_member as cm')
        .leftJoin('auth.user as u', 'cm.userId', 'u.id')
        .select([
            'u.id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.status',
            'cm.companyId',
            'cm.staffCode',
            'cm.position',
            'cm.department',
            'cm.identityNumber',
            'cm.hireDate',
        ])
        .where(eb => {
            const cond = [eb('cm.userId', '=', params.userId)]
            if (params.companyId) cond.push(eb('cm.companyId', '=', params.companyId))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function getAuthContext(userId: AuthUserId) {
    return db
        .selectFrom('organization.company_member as cm')
        .select(['cm.companyId'])
        .where('cm.userId', '=', userId)
        .orderBy('cm.companyId', 'asc')
        .executeTakeFirst()
}

export async function findAll(query: AuthProfileQuery, companyId: OrganizationBusCompanyId) {
    const { position, department, status, code, email, phone, identityNumber, limit, next } = query

    return db
        .selectFrom('organization.company_member as cm')
        .innerJoin('auth.user as u', 'cm.userId', 'u.id')
        .select([
            'cm.id as cursorId',
            'cm.publicId as id',
            'cm.userId',
            'cm.staffCode',
            'cm.position',
            'cm.department',
            'u.phone',
            'u.fullName',
            'u.email',
            'cm.identityNumber',
            'cm.hireDate',
            sql<AuthOperatorRole>`u.role`.as('role'),
            'u.status',
        ])
        .where(eb => {
            const cond = [eb('cm.companyId', '=', companyId), eb('u.role', 'in', OPERATOR_ROLES)]
            if (position) cond.push(eb('cm.position', '=', position))
            if (department) cond.push(eb('cm.department', '=', department))
            if (status) cond.push(eb('u.status', '=', status))
            if (code) cond.push(eb('cm.staffCode', '=', code))
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (identityNumber) cond.push(eb('cm.identityNumber', '=', identityNumber))
            if (next) cond.push(eb('cm.id', '>', next))
            return eb.and(cond)
        })
        .limit(limit + 1)
        .orderBy('cm.id', 'asc')
        .execute()
}

export async function findAllCompanyAdmins(query: CompanyAdminQuery) {
    const { limit, next, companyId } = query
    return db
        .selectFrom('auth.user as u')
        .innerJoin('organization.company_member as cm', 'cm.userId', 'u.id')
        .leftJoin('organization.bus_company as bc', 'bc.id', 'cm.companyId')
        .where(eb => {
            const cond = [eb('u.role', '=', AuthUserRole.enum.operator_admin)]
            if (companyId) cond.push(eb('cm.companyId', '=', companyId))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select([
            'u.id as cursorId',
            'u.publicId as id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.status',
            sql<AuthOperatorRole>`u.role`.as('role'),
            'cm.companyId',
            'bc.name as companyName',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}
