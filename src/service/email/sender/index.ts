import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | undefined

const user = process.env.MAIL_USER ?? ''
const pass = process.env.MAIL_PASS ?? ''
const to = process.env.MAIL_TO ?? ''


function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass,
            }
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
