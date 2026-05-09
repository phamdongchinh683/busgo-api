export function otpTemplate(params: { otp: string }) {
    const { otp } = params

    return `
<div style="margin:0;padding:28px;background:#f3f7f4;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;color:#1b2a1f;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dde7df;border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(18,38,24,0.08);">
    <div style="height:6px;background:#4caf50;"></div>
    <div style="padding:18px 28px;background:#ffffff;color:#17311d;border-bottom:1px solid #ebf1ec;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:116px;vertical-align:middle;">
            <img src="cid:bus-go-logo" alt="Bus Go" style="display:block;width:108px;max-width:108px;height:auto;border:0;background:transparent;" />
          </td>
          <td style="vertical-align:middle;text-align:left;padding-left:8px;">
            <div style="font-size:18px;font-weight:800;letter-spacing:0.2px;color:#1f3b27;">Hệ thống Bus Go</div>
            <div style="font-size:12px;color:#5a7460;margin-top:4px;">Bảo mật tài khoản • Xác thực OTP</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:30px 28px;">
      <h1 style="margin:0 0 10px;font-size:24px;line-height:1.35;color:#17311d;">Mã OTP xác thực của bạn</h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.75;color:#48614f;">
        Chúng tôi nhận được yêu cầu xác thực tài khoản Bus Go. Vui lòng nhập mã OTP bên dưới để tiếp tục. Mã có hiệu lực trong <strong>2 phút</strong>.
      </p>
      <div style="margin:0 0 20px;padding:16px 18px;text-align:center;font-size:34px;letter-spacing:9px;font-weight:800;color:#17311d;background:#f6fbf7;border:1px dashed #4caf50;border-radius:12px;">
        ${otp}
      </div>
      <div style="margin:0 0 18px;padding:12px 14px;background:#f4fbf5;border-left:4px solid #4caf50;border-radius:8px;font-size:13px;line-height:1.7;color:#36533d;">
        Vì lý do bảo mật, tuyệt đối không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên hỗ trợ.
      </div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#5b7462;">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay để bảo vệ tài khoản.
      </p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e5eee7;font-size:12px;color:#607b67;background:#f8fbf8;">
      Bản quyền © ${new Date().getFullYear()} Bus Go.
    </div>
  </div>
</div>
`
}

export function departureReminderTemplate() {
    return `
<div style="margin:0;padding:28px;background:#f3f7f4;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;color:#1b2a1f;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dde7df;border-radius:16px;overflow:hidden;box-shadow:0 12px 28px rgba(18,38,24,0.08);">
    <div style="height:6px;background:#4caf50;"></div>
    <div style="padding:18px 28px;background:#ffffff;color:#17311d;border-bottom:1px solid #ebf1ec;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:116px;vertical-align:middle;">
            <img src="cid:bus-go-logo" alt="Bus Go" style="display:block;width:108px;max-width:108px;height:auto;border:0;background:transparent;" />
          </td>
          <td style="vertical-align:middle;text-align:left;padding-left:8px;">
            <div style="font-size:18px;font-weight:800;letter-spacing:0.2px;color:#1f3b27;">Bus Go</div>
            <div style="font-size:12px;color:#5a7460;margin-top:4px;">Nhắc lịch trình • Thông báo khởi hành</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:30px 28px;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.35;color:#17311d;">Nhắc bạn: Chuyến đi của bạn khởi hành hôm nay</h1>
      <p style="margin:0 0 10px;font-size:14px;line-height:1.75;color:#48614f;">Xin chào quý hành khách,</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.75;color:#48614f;">
        Đây là email nhắc lịch trình từ Bus Go. Vui lòng kiểm tra lại giờ khởi hành, điểm đón và thông tin vé trong ứng dụng trước khi di chuyển.
      </p>
      <div style="padding:12px 14px;background:#f6fbf7;border-left:4px solid #4caf50;border-radius:8px;font-size:13px;line-height:1.7;color:#36533d;">
        Gợi ý: Hãy đến điểm đón trước 15-20 phút, chuẩn bị sẵn mã vé/QR và giấy tờ tùy thân để lên xe nhanh hơn.
      </div>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#5b7462;">
        Cảm ơn bạn đã đồng hành cùng Bus Go. Chúc bạn có hành trình an toàn, đúng giờ và thoải mái.
      </p>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e5eee7;font-size:12px;color:#607b67;background:#f8fbf8;">
      Bản quyền © ${new Date().getFullYear()} Bus Go. Mọi quyền được bảo lưu.
    </div>
  </div>
</div>
`
}
