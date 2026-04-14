import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | undefined

const port = Number(process.env.MAIL_PORT ?? 587)
const user = process.env.MAIL_USER ?? ''
const pass = process.env.MAIL_PASS ?? ''
const to = process.env.MAIL_TO ?? ''

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port,
            secure: port === 465,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
            auth: {
                user: user,
                pass: pass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        })
    }

    return transporter
}

export function sendMail(params: { to?: string; subject: string; text?: string; html?: string }) {
    return getTransporter().sendMail({
        from: `"MyCompany" <${user}>`,
        to: params.to ?? to,
        subject: params.subject,
        text: params.text,
        html: params.html,
    })
}
