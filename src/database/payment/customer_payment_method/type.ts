import { z } from 'zod'

export const PaymentCustomerPaymentMethodId = z.coerce
    .number()
    .brand<'payment.customer_payment_method.id'>()
export type PaymentCustomerPaymentMethodId = z.infer<typeof PaymentCustomerPaymentMethodId>
