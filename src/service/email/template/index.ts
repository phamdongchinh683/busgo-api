export function otpTemplate(params: { otp: string }) {
    const { otp } = params

    return `
<div style="margin:0;padding:28px;background:#f4f6fb;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6eaf2;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(2,6,23,0.06);">
    <div style="padding:22px 28px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;">
      <div style="font-size:18px;font-weight:700;letter-spacing:0.2px;">Bus System</div>
      <div style="font-size:12px;opacity:0.82;margin-top:4px;">Secure account verification</div>
    </div>
    <div style="padding:30px 28px;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.35;color:#0f172a;">Your OTP Code</h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">
        Use the code below to continue your account action. This code will expire in 2 minutes.
      </p>
      <div style="margin:0 0 20px;padding:16px 18px;text-align:center;font-size:34px;letter-spacing:9px;font-weight:800;color:#0f172a;background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;">
        ${otp}
      </div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
        For security, do not share this code with anyone.
      </p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;background:#f8fafc;">
      Copyright © ${new Date().getFullYear()} Bus System. All rights reserved.
    </div>
  </div>
</div>
`
}

export function departureReminderTemplate() {
    return `
<div style="margin:0;padding:28px;background:#f4f6fb;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6eaf2;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(2,6,23,0.06);">
    <div style="padding:22px 28px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;">
      <div style="font-size:18px;font-weight:700;letter-spacing:0.2px;">Bus System</div>
      <div style="font-size:12px;opacity:0.82;margin-top:4px;">Trip notification</div>
    </div>
    <div style="padding:30px 28px;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.35;color:#0f172a;">Reminder: Trip departs today</h1>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#475569;">Hello User,</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
        Your trip departs today. Please open the app to check your departure details and arrive at the station early.
      </p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;background:#f8fafc;">
      Copyright © ${new Date().getFullYear()} Bus System. All rights reserved.
    </div>
  </div>
</div>
`
}
