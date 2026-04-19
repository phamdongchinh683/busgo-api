import type { FastifyReply, FastifyRequest } from 'fastify'
import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { requireRoles } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { RevenueExportQuery } from '../../../../../model/query/payment/index.js'
import z from 'zod'

const __filename = new URL('', import.meta.url).pathname

type RevenueExportQueryType = z.infer<typeof RevenueExportQuery>

api.route({
    ...endpoint(__filename),

    handler: async (
        request: FastifyRequest<{ Querystring: RevenueExportQueryType }>,
        reply: FastifyReply
    ) => {
        await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const buffer = await bus.payment.payment.exportCompanyRevenueExcel(request.query)
        const year = request.query.year ?? new Date().getFullYear()
        const suffix = request.query.type === 'monthly' ? 'monthly' : 'yearly'
        const method = request.query.method
        const filename = `company-revenue-${year}-${suffix}-${method}.xlsx`
        return reply
            .header(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            .header('Content-Disposition', `attachment; filename="${filename}"`)
            .send(buffer)
    },

    schema: {
        querystring: RevenueExportQuery,
        tags: tags(__filename),
        security: bearer,
    },
})
