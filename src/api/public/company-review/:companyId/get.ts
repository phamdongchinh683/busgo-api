import { api, endpoint, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { CompanyIdParam } from '../../../../model/params/company_review/index.js'
import { GetCompanyReviewsQuery } from '../../../../model/query/company_review/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const { companyId } = request.params
        return bus.organization.companyReview.getCompanyReviews(companyId, request.query)
    },
    schema: {
        params: CompanyIdParam,
        querystring: GetCompanyReviewsQuery,
        tags: tags(__filename),
    },
})
