import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function getOne(params: { userId: AuthUserId; companyId?: OrganizationBusCompanyId }) {
    return db
        .selectFrom('organization.company_member as cm')
        .leftJoin('auth.user as u', 'cm.userId', 'u.id')
        .select([
            'u.id',
            'u.firstName',
            'u.lastName',
            'u.email',
            'u.phone',
            'u.role',
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
