import { AuthUserOtpTable } from '../database/auth/user_otp/table.js'
import { AuthNotificationTable } from '../database/auth/notification/table.js'
import { AuthUserTable } from '../database/auth/user/table.js'
import { AuthUserDeviceTable } from '../database/auth/user_device/table.js'
import { PaymentCustomerPaymentMethodTable } from '../database/payment/customer_payment_method/table.js'
import { BookingTable } from '../database/booking/booking/table.js'
import { BookingTicketTable } from '../database/booking/ticket/table.js'
import { BookingSeatSegmentTable } from '../database/booking/seat_segment/table.js'
import { BookingCouponTable } from '../database/booking/coupon/table.js'
import { BookingPromotionNewsTable } from '../database/booking/promotion_new/table.js'
import { OperationTripTable } from '../database/operation/trip/table.js'
import { OperationStationTable } from '../database/operation/station/table.js'
import { OrganizationBusCompanyTable } from '../database/organization/bus_company/table.js'
import { OrganizationVehicleTable } from '../database/organization/vehicle/table.js'
import { OrganizationSeatTable } from '../database/organization/seat/table.js'
import { OperationRouteTable } from '../database/operation/route/table.js'
import { OperationTripScheduleTable } from '../database/operation/trip-schedule/table.js'
import { OperationTripStopTemplateTable } from '../database/operation/trip-stop-template/table.js'
import { OperationTripPriceTemplateTable } from '../database/operation/trip_price_template/table.js'
import { OrganizationCompanyMemberTable } from '../database/organization/company_member/table.js'
import { OrganizationBusCompanyReviewTable } from '../database/organization/bus_company_review/table.js'
import { ChatBoxTable } from '../database/chat/box/table.js'
import { ChatMessageTable } from '../database/chat/message/table.js'
import { OrganizationDriverMonthlyStatTable } from '../database/organization/driver_monthly_stat/table.js'
export interface Database {
    'auth.user': AuthUserTable
    'auth.user_device': AuthUserDeviceTable
    'auth.notification': AuthNotificationTable
    'auth.user_otp': AuthUserOtpTable
    'payment.customer_payment_method': PaymentCustomerPaymentMethodTable
    'booking.booking': BookingTable
    'booking.coupon': BookingCouponTable
    'booking.ticket': BookingTicketTable
    'booking.seat_segment': BookingSeatSegmentTable
    'booking.promotion_new': BookingPromotionNewsTable
    'operation.trip': OperationTripTable
    'operation.station': OperationStationTable
    'organization.bus_company': OrganizationBusCompanyTable
    'organization.vehicle': OrganizationVehicleTable
    'organization.seat': OrganizationSeatTable
    'operation.route': OperationRouteTable
    'operation.trip_schedule': OperationTripScheduleTable
    'operation.trip_stop_template': OperationTripStopTemplateTable
    'operation.trip_price_template': OperationTripPriceTemplateTable
    'organization.company_member': OrganizationCompanyMemberTable
    'organization.bus_company_review': OrganizationBusCompanyReviewTable
    'chat.box': ChatBoxTable
    'chat.message': ChatMessageTable
    'organization.driver_monthly_stat': OrganizationDriverMonthlyStatTable
}
