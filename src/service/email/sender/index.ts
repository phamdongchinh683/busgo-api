import type { Email } from '../../../model/common.js'

const apiKey = process.env.RESEND_API_KEY ?? ''
const from = process.env.MAIL_FROM ?? ''
const logoUrl =
    'https://res.cloudinary.com/dinvm5h7g/image/upload/v1776836282/logo/ChatGPT_Image_Apr_22_2026_12_37_40_PM_melvlj.png'

const inlineLogoAttachment = {
    filename: 'bus-go-logo.png',
    path: logoUrl,
    content_id: 'bus-go-logo',
}

export async function send(params: { to: Email; subject: string; text?: string; html: string }) {
    return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `"BusGo" <${from}>`,
            to: [params.to],
            subject: params.subject,
            text: params.text,
            html: params.html,
            attachments: [inlineLogoAttachment],
        }),
    })
}

export async function sendMany(params: {
    to: Email[]
    subject: string
    text?: string
    html: string
}) {
    return fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `"BusGo" <${from}>`,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
            attachments: [inlineLogoAttachment],
        }),
    })
}
