import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../user/type.js'
import { AuthProfileQuery } from '../../../model/query/staff/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { AuthStaffProfileRole } from './type.js'
import { CompanyAdminQuery } from '../../../model/query/company-admin/index.js'

export async function getOne(params: { userId: AuthUserId; companyId?: OrganizationBusCompanyId }) {
    return db
        .selectFrom('auth.staff_profile')
        .leftJoin('auth.user as u', 'auth.staff_profile.userId', 'u.id')
        .select([
            'u.id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.status',
            'auth.staff_profile.companyId as companyId',
            'auth.staff_profile.staffCode as staffCode',
            'auth.staff_profile.position as position',
            'auth.staff_profile.department as department',
            'auth.staff_profile.identityNumber as identityNumber',
            'auth.staff_profile.hireDate as hireDate',
        ])
        .where(eb => {
            const cond = []
            cond.push(eb('auth.staff_profile.userId', '=', params.userId))
            if (params.companyId) {
                cond.push(eb('auth.staff_profile.companyId', '=', params.companyId))
            }
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function getAuthContext(userId: AuthUserId) {
    return db
        .selectFrom('auth.staff_profile as sp')
        .select(['sp.companyId', 'sp.role as staffProfileRole'])
        .where('sp.userId', '=', userId)
        .executeTakeFirst()
}

export async function updateRole(userId: AuthUserId, role: AuthStaffProfileRole) {
    return db
        .updateTable('auth.staff_profile')
        .set({ role })
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function findAll(query: AuthProfileQuery, companyId: OrganizationBusCompanyId) {
    const { position, department, status, code, email, phone, identityNumber, limit, next } = query

    return db
        .selectFrom('auth.staff_profile as a')
        .innerJoin('auth.user as u', 'a.userId', 'u.id')
        .select([
            'a.id',
            'a.userId',
            'a.staffCode',
            'a.position',
            'a.department',
            'u.phone',
            'u.fullName',
            'u.email',
            'a.identityNumber',
            'a.hireDate',
            'a.role',
            'a.status',
        ])
        .where(eb => {
            const cond = []
            cond.push(eb('a.companyId', '=', companyId))
            if (position) {
                cond.push(eb('a.position', '=', position))
            }
            if (department) {
                cond.push(eb('a.department', '=', department))
            }
            if (status) {
                cond.push(eb('a.status', '=', status))
            }
            if (code) {
                cond.push(eb('a.staffCode', '=', code))
            }
            if (email) {
                cond.push(eb('u.email', '=', email))
            }
            if (phone) {
                cond.push(eb('u.phone', '=', phone))
            }
            if (identityNumber) {
                cond.push(eb('a.identityNumber', '=', identityNumber))
            }
            if (next) {
                cond.push(eb('a.id', '>', next))
            }
            return eb.and(cond)
        })
        .limit(limit + 1)
        .orderBy('id', 'asc')
        .execute()
}

export async function findAllCompanyAdmins(query: CompanyAdminQuery) {
    const { limit, next, companyId } = query
    return db
        .selectFrom('auth.user as u')
        .innerJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .leftJoin('organization.bus_company as bc', 'bc.id', 'sp.companyId')
        .where(eb => {
            const cond = []
            cond.push(eb('sp.role', '=', AuthStaffProfileRole.enum.company_admin))
            if (companyId) cond.push(eb('sp.companyId', '=', companyId))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.status',
            'sp.role',
            'sp.companyId',
            'bc.name as companyName',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}
