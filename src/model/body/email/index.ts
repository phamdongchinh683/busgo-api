import z from 'zod'
import { Email } from '../../common.js'

export const SendEmailBody = z.object({
    to: Email,
    subject: z.string().trim().min(1).max(255),
    template: z.string().min(1).max(100_000),
    params: z.record(z.string().min(1), z.unknown()).default({}),
    text: z.string().max(10_000).optional(),
})

export type SendEmailBody = z.infer<typeof SendEmailBody>
