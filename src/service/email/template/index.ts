export function otpTemplate(params: { otp: string }) {
    const { otp } = params

    return `
<div style="margin:0;padding:24px;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;background:#111827;color:#ffffff;font-size:18px;font-weight:600;">
      Bus System
    </div>
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.4;color:#111827;">Your OTP Code</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
        Use the code below to continue your account action. This code will expire in 2 minutes.
      </p>
      <div style="margin:0 0 20px;padding:14px 16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;background:#f3f4f6;border:1px dashed #d1d5db;border-radius:10px;">
        ${otp}
      </div>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
        For security, do not share this code with anyone.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
      Copyright © ${new Date().getFullYear()} Bus System. All rights reserved.
    </div>
  </div>
</div>
`
}
