import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { BusCompanyResponse } from '../../../model/body/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const c = await bus.organization.busCompany.getOne(userInfo.companyId)
        if (!c)
            throw new (await import('../../../app/index.js')).HttpErr.NotFound('Company not found')
        const company = {
            name: c.name,
            hotline: c.hotline,
            logoUrl: c.logoUrl,
            address: c.address,
            latitude: c.latitude,
            longitude: c.longitude,
            reviewCount: c.reviewCount,
            star1: c.star1,
            star2: c.star2,
            star3: c.star3,
            star4: c.star4,
            star5: c.star5,
        }
        return { company }
    },

    schema: {
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
