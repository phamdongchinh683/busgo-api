import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | undefined

const port = Number(process.env.MAIL_PORT ?? '')
const user = process.env.MAIL_USER ?? ''
const pass = process.env.MAIL_PASS ?? ''
const to = process.env.MAIL_TO ?? ''

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: Number(port),
            secure: false,
            auth: {
                user: user,
                pass: pass,
            },
        })
    }

    return transporter
}

export function sendMail(params: { to?: string; subject: string; text?: string; html?: string }) {
    console.log({
        from: process.env.MAIL_FROM,
        to: params.to ?? to,
        user: user,
        pass: pass,
        port: port,
    })
    return getTransporter().sendMail({
        from: `"MyCompany" <${user}>`,
        to: params.to ?? to,
        subject: params.subject,
        text: params.text,
        html: params.html,
    })
}
