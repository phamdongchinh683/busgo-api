import { AuthUserId } from '../../../database/auth/user/type.js'

export function emailRequestAccess(params: { id: AuthUserId; fullName: string }) {
    return `

    <!doctype html>
    <html>
      <body style="margin: 0; padding: 24px; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="640"
                cellpadding="0"
                cellspacing="0"
                style="max-width: 640px; width: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;"
              >
                <tr>
                  <td style="padding: 28px;">
                    <h1 style="margin: 0 0 14px 0; font-size: 24px; line-height: 1.35; color: #111827;">Xin chào, Quản Trị Viên!</h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.75; color: #374151;">
                      <strong>${params.fullName}</strong> đã tạo một tài khoản công ty. Vui lòng kích hoạt tài khoản để bắt đầu sử dụng.
                    </p>
    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center">
                          <a
                            href="https://bus-system.webhop.me/users/${params.id}"
                            target="_blank"
                            style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 22px; border-radius: 8px;"
                          >
                            Kích hoạt
                          </a>
                        </td>
                      </tr>
                    </table>
    
                    <p style="margin: 0; font-size: 14px; line-height: 1.75; color: #4b5563;">
                      Trân trọng,<br />
                      Đội ngũ Bus System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
`
}
