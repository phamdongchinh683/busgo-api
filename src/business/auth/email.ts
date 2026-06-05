import { HttpErr } from '../../app/index.js'
import type { SendEmailBody } from '../../model/body/email/index.js'
import { service } from '../../service/index.js'

async function resendErrorExtra(response: Response) {
    const body = await response.text()

    if (!body) {
        return {
            status: response.status,
            statusText: response.statusText,
        }
    }

    try {
        return {
            status: response.status,
            statusText: response.statusText,
            body: JSON.parse(body),
        }
    } catch {
        return {
            status: response.status,
            statusText: response.statusText,
            body: body.slice(0, 500),
        }
    }
}

export async function sendTemplate(params: SendEmailBody) {
    const html = service.email.template.renderHtmlTemplate({
        template: params.template,
        params: params.params,
    })

    const response = await service.email.sender.send({
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: html,
    })

    if (!response.ok) {
        throw new HttpErr.UnprocessableEntity(
            'Không thể gửi email.',
            'EMAIL_SEND_FAILED',
            await resendErrorExtra(response)
        )
    }

    return {
        message: 'Thành công',
    }
}
