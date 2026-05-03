import { AuthUserOtpTable } from '../database/auth/user_otp/table.js'
import { AuthNotificationTable } from '../database/auth/notification/table.js'
import { AuthStaffProfileTable } from '../database/auth/staff_profile/table.js'
import { AuthUserTable } from '../database/auth/user/table.js'
import { AuthUserDeviceTable } from '../database/auth/user_device/table.js'
import { PaymentTable } from '../database/payment/payment/table.js'
import { PaymentCustomerPaymentMethodTable } from '../database/payment/customer_payment_method/table.js'
import { BookingTable } from '../database/booking/booking/table.js'
import { BookingTicketTable } from '../database/booking/ticket/table.js'
import { BookingSeatSegmentTable } from '../database/booking/seat_segment/table.js'
import { BookingCouponTable } from '../database/booking/coupon/table.js'
import { OperationTripTable } from '../database/operation/trip/table.js'
import { OperationStationTable } from '../database/operation/station/table.js'
import { OrganizationBusCompanyTable } from '../database/organization/bus_company/table.js'
import { OrganizationVehicleTable } from '../database/organization/vehicle/table.js'
import { OrganizationSeatTable } from '../database/organization/seat/table.js'
import { OperationRouteTable } from '../database/operation/route/table.js'
import { OperationTripScheduleTable } from '../database/operation/trip-schedule/table.js'
import { OperationTripStopTemplateTable } from '../database/operation/trip-stop-template/table.js'
import { OperationTripPriceTemplateTable } from '../database/operation/trip_price_template/table.js'
import { OrganizationCompanyDriverTable } from '../database/organization/company_driver/table.js'

export interface Database {
    'auth.user': AuthUserTable
    'auth.user_device': AuthUserDeviceTable
    'auth.notification': AuthNotificationTable
    'auth.user_otp': AuthUserOtpTable
    'auth.staff_profile': AuthStaffProfileTable
    'payment.payment': PaymentTable
    'payment.customer_payment_method': PaymentCustomerPaymentMethodTable
    'booking.booking': BookingTable
    'booking.coupon': BookingCouponTable
    'booking.ticket': BookingTicketTable
    'booking.seat_segment': BookingSeatSegmentTable
    'operation.trip': OperationTripTable
    'operation.station': OperationStationTable
    'organization.bus_company': OrganizationBusCompanyTable
    'organization.vehicle': OrganizationVehicleTable
    'organization.seat': OrganizationSeatTable
    'operation.route': OperationRouteTable
    'operation.trip_schedule': OperationTripScheduleTable
    'operation.trip_stop_template': OperationTripStopTemplateTable
    'operation.trip_price_template': OperationTripPriceTemplateTable
    'organization.company_driver': OrganizationCompanyDriverTable
}
