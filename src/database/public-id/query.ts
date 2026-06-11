import { HttpErr } from '../../app/index.js'
import { db } from '../../datasource/db.js'
import type { AuthNotificationId, AuthNotificationPublicId } from '../auth/notification/type.js'
import type { AuthUserId, AuthUserPublicId } from '../auth/user/type.js'
import type { AuthUserDeviceId, AuthUserDevicePublicId } from '../auth/user_device/type.js'
import type { BookingId, BookingPublicId } from '../booking/booking/type.js'
import type { BookingCouponId, BookingCouponPublicId } from '../booking/coupon/type.js'
import type {
    BookingPromotionNewsId,
    BookingPromotionNewsPublicId,
} from '../booking/promotion_new/type.js'
import type { BookingTicketId, BookingTicketPublicId } from '../booking/ticket/type.js'
import type { ChatBoxId, ChatBoxPublicId } from '../chat/box/type.js'
import type { ChatMessageId, ChatMessagePublicId } from '../chat/message/type.js'
import type { OperationRouteId, OperationRoutePublicId } from '../operation/route/type.js'
import type { OperationStationId, OperationStationPublicId } from '../operation/station/type.js'
import type {
    OperationTripScheduleId,
    OperationTripSchedulePublicId,
} from '../operation/trip-schedule/type.js'
import type {
    OperationTripStopTemplateId,
    OperationTripStopTemplatePublicId,
} from '../operation/trip-stop-template/type.js'
import type { OperationTripId, OperationTripPublicId } from '../operation/trip/type.js'
import type {
    OperationTripPriceTemplateId,
    OperationTripPriceTemplatePublicId,
} from '../operation/trip_price_template/type.js'
import type {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../organization/bus_company/type.js'
import type {
    OrganizationBusCompanyReviewId,
    OrganizationBusCompanyReviewPublicId,
} from '../organization/bus_company_review/type.js'
import type {
    OrganizationCompanyMemberId,
    OrganizationCompanyMemberPublicId,
} from '../organization/company_member/type.js'
import type { OrganizationSeatId, OrganizationSeatPublicId } from '../organization/seat/type.js'
import type {
    OrganizationVehicleId,
    OrganizationVehiclePublicId,
} from '../organization/vehicle/type.js'
import type {
    PaymentCustomerPaymentMethodId,
    PaymentCustomerPaymentMethodPublicId,
} from '../payment/customer_payment_method/type.js'
import type { PaymentId, PaymentPublicId } from '../payment/payment/type.js'

interface PublicResourceMap {
    user: { id: AuthUserId; publicId: AuthUserPublicId }
    userDevice: { id: AuthUserDeviceId; publicId: AuthUserDevicePublicId }
    notification: { id: AuthNotificationId; publicId: AuthNotificationPublicId }
    booking: { id: BookingId; publicId: BookingPublicId }
    coupon: { id: BookingCouponId; publicId: BookingCouponPublicId }
    ticket: { id: BookingTicketId; publicId: BookingTicketPublicId }
    promotionNews: { id: BookingPromotionNewsId; publicId: BookingPromotionNewsPublicId }
    busCompany: { id: OrganizationBusCompanyId; publicId: OrganizationBusCompanyPublicId }
    busCompanyReview: {
        id: OrganizationBusCompanyReviewId
        publicId: OrganizationBusCompanyReviewPublicId
    }
    companyMember: { id: OrganizationCompanyMemberId; publicId: OrganizationCompanyMemberPublicId }
    seat: { id: OrganizationSeatId; publicId: OrganizationSeatPublicId }
    vehicle: { id: OrganizationVehicleId; publicId: OrganizationVehiclePublicId }
    route: { id: OperationRouteId; publicId: OperationRoutePublicId }
    station: { id: OperationStationId; publicId: OperationStationPublicId }
    tripSchedule: { id: OperationTripScheduleId; publicId: OperationTripSchedulePublicId }
    tripStopTemplate: {
        id: OperationTripStopTemplateId
        publicId: OperationTripStopTemplatePublicId
    }
    trip: { id: OperationTripId; publicId: OperationTripPublicId }
    tripPriceTemplate: {
        id: OperationTripPriceTemplateId
        publicId: OperationTripPriceTemplatePublicId
    }
    chatBox: { id: ChatBoxId; publicId: ChatBoxPublicId }
    chatMessage: { id: ChatMessageId; publicId: ChatMessagePublicId }
    payment: { id: PaymentId; publicId: PaymentPublicId }
    customerPaymentMethod: {
        id: PaymentCustomerPaymentMethodId
        publicId: PaymentCustomerPaymentMethodPublicId
    }
}

export type PublicResource = keyof PublicResourceMap

export async function resolve<K extends PublicResource>(
    resource: K,
    publicId: PublicResourceMap[K]['publicId']
): Promise<PublicResourceMap[K]['id']> {
    let row: { id: number } | undefined

    switch (resource) {
        case 'user':
            row = await db
                .selectFrom('auth.user')
                .select('id')
                .where('publicId', '=', publicId as AuthUserPublicId)
                .executeTakeFirst()
            break
        case 'userDevice':
            row = await db
                .selectFrom('auth.user_device')
                .select('id')
                .where('publicId', '=', publicId as AuthUserDevicePublicId)
                .executeTakeFirst()
            break
        case 'notification':
            row = await db
                .selectFrom('auth.notification')
                .select('id')
                .where('publicId', '=', publicId as AuthNotificationPublicId)
                .executeTakeFirst()
            break
        case 'booking':
            row = await db
                .selectFrom('booking.booking')
                .select('id')
                .where('publicId', '=', publicId as BookingPublicId)
                .executeTakeFirst()
            break
        case 'coupon':
            row = await db
                .selectFrom('booking.coupon')
                .select('id')
                .where('publicId', '=', publicId as BookingCouponPublicId)
                .executeTakeFirst()
            break
        case 'ticket':
            row = await db
                .selectFrom('booking.ticket')
                .select('id')
                .where('publicId', '=', publicId as BookingTicketPublicId)
                .executeTakeFirst()
            break
        case 'promotionNews':
            row = await db
                .selectFrom('booking.promotion_new')
                .select('id')
                .where('publicId', '=', publicId as BookingPromotionNewsPublicId)
                .executeTakeFirst()
            break
        case 'busCompany':
            row = await db
                .selectFrom('organization.bus_company')
                .select('id')
                .where('publicId', '=', publicId as OrganizationBusCompanyPublicId)
                .executeTakeFirst()
            break
        case 'busCompanyReview':
            row = await db
                .selectFrom('organization.bus_company_review')
                .select('id')
                .where('publicId', '=', publicId as OrganizationBusCompanyReviewPublicId)
                .executeTakeFirst()
            break
        case 'companyMember':
            row = await db
                .selectFrom('organization.company_member')
                .select('id')
                .where('publicId', '=', publicId as OrganizationCompanyMemberPublicId)
                .executeTakeFirst()
            break
        case 'seat':
            row = await db
                .selectFrom('organization.seat')
                .select('id')
                .where('publicId', '=', publicId as OrganizationSeatPublicId)
                .executeTakeFirst()
            break
        case 'vehicle':
            row = await db
                .selectFrom('organization.vehicle')
                .select('id')
                .where('publicId', '=', publicId as OrganizationVehiclePublicId)
                .executeTakeFirst()
            break
        case 'route':
            row = await db
                .selectFrom('operation.route')
                .select('id')
                .where('publicId', '=', publicId as OperationRoutePublicId)
                .executeTakeFirst()
            break
        case 'station':
            row = await db
                .selectFrom('operation.station')
                .select('id')
                .where('publicId', '=', publicId as OperationStationPublicId)
                .executeTakeFirst()
            break
        case 'tripSchedule':
            row = await db
                .selectFrom('operation.trip_schedule')
                .select('id')
                .where('publicId', '=', publicId as OperationTripSchedulePublicId)
                .executeTakeFirst()
            break
        case 'tripStopTemplate':
            row = await db
                .selectFrom('operation.trip_stop_template')
                .select('id')
                .where('publicId', '=', publicId as OperationTripStopTemplatePublicId)
                .executeTakeFirst()
            break
        case 'trip':
            row = await db
                .selectFrom('operation.trip')
                .select('id')
                .where('publicId', '=', publicId as OperationTripPublicId)
                .executeTakeFirst()
            break
        case 'tripPriceTemplate':
            row = await db
                .selectFrom('operation.trip_price_template')
                .select('id')
                .where('publicId', '=', publicId as OperationTripPriceTemplatePublicId)
                .executeTakeFirst()
            break
        case 'chatBox':
            row = await db
                .selectFrom('chat.box')
                .select('id')
                .where('publicId', '=', publicId as ChatBoxPublicId)
                .executeTakeFirst()
            break
        case 'chatMessage':
            row = await db
                .selectFrom('chat.message')
                .select('id')
                .where('publicId', '=', publicId as ChatMessagePublicId)
                .executeTakeFirst()
            break
        case 'payment':
            row = await db
                .selectFrom('payment.payment')
                .select('id')
                .where('publicId', '=', publicId as PaymentPublicId)
                .executeTakeFirst()
            break
        case 'customerPaymentMethod':
            row = await db
                .selectFrom('payment.customer_payment_method')
                .select('id')
                .where('publicId', '=', publicId as PaymentCustomerPaymentMethodPublicId)
                .executeTakeFirst()
            break
    }

    if (!row) {
        throw new HttpErr.NotFound('Không tìm thấy tài nguyên.', {}, 'RESOURCE_NOT_FOUND')
    }

    return row.id as PublicResourceMap[K]['id']
}
