import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { BookingRequestBody, BookingResponse } from '../../../model/body/booking/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const [couponId, outBoundIds, returnBoundIds] = await Promise.all([
            request.body.couponId
                ? bus.publicId.resolve('coupon', request.body.couponId)
                : undefined,
            Promise.all([
                bus.publicId.resolve('trip', request.body.outBound.tripId),
                bus.publicId.resolve('seat', request.body.outBound.seatId),
                bus.publicId.resolve('station', request.body.outBound.fromStationId),
                bus.publicId.resolve('busCompany', request.body.outBound.companyId),
                bus.publicId.resolve('station', request.body.outBound.toStationId),
            ]),
            request.body.returnBound
                ? Promise.all([
                      bus.publicId.resolve('trip', request.body.returnBound.tripId),
                      bus.publicId.resolve('seat', request.body.returnBound.seatId),
                      bus.publicId.resolve('station', request.body.returnBound.fromStationId),
                      bus.publicId.resolve('busCompany', request.body.returnBound.companyId),
                      bus.publicId.resolve('station', request.body.returnBound.toStationId),
                  ])
                : undefined,
        ])

        return bus.booking.booking.initBooking(
            {
                ...request.body,
                couponId,
                outBound: {
                    ...request.body.outBound,
                    tripId: outBoundIds[0],
                    seatId: outBoundIds[1],
                    fromStationId: outBoundIds[2],
                    companyId: outBoundIds[3],
                    toStationId: outBoundIds[4],
                },
                returnBound:
                    request.body.returnBound && returnBoundIds
                        ? {
                              ...request.body.returnBound,
                              tripId: returnBoundIds[0],
                              seatId: returnBoundIds[1],
                              fromStationId: returnBoundIds[2],
                              companyId: returnBoundIds[3],
                              toStationId: returnBoundIds[4],
                          }
                        : undefined,
            },
            userInfo.id
        )
    },

    schema: {
        body: BookingRequestBody,
        response: { 200: BookingResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
