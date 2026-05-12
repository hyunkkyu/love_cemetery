import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendVerifyCode(to: string, code: string) {
  await transporter.sendMail({
    from: `"명예의전당 👻" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "🔮 이메일 인증 코드 - 명예의전당",
    html: `
      <div style="max-width:480px;margin:0 auto;background:#0c0c14;color:#e0e0f0;padding:32px;border-radius:16px;font-family:sans-serif;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;">👻</span>
          <h1 style="color:#8b7bf7;margin:8px 0 4px;">명예의전당</h1>
          <p style="color:#b0b0cc;font-size:13px;">이메일 인증</p>
        </div>
        <div style="background:#1c1c30;padding:20px;border-radius:12px;margin-bottom:20px;text-align:center;">
          <p style="color:#b0b0cc;font-size:14px;margin:0 0 16px;">
            아래 인증 코드를 입력해주세요.
          </p>
          <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#8b7bf7;padding:16px;background:#0c0c14;border-radius:12px;display:inline-block;">
            ${code}
          </div>
          <p style="color:#666680;font-size:12px;margin:16px 0 0;">
            이 코드는 <strong>5분</strong>간 유효합니다.
          </p>
        </div>
        <p style="color:#666680;font-size:11px;text-align:center;">
          본인이 요청하지 않았다면 이 메일을 무시해주세요.
        </p>
      </div>
    `,
  })
}

export async function sendResetEmail(to: string, nickname: string, resetLink: string) {
  await transporter.sendMail({
    from: `"명예의전당 👻" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "🔮 비밀번호 재설정 - 명예의전당",
    html: `
      <div style="max-width:480px;margin:0 auto;background:#0c0c14;color:#e0e0f0;padding:32px;border-radius:16px;font-family:sans-serif;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;">👻</span>
          <h1 style="color:#8b7bf7;margin:8px 0 4px;">명예의전당</h1>
          <p style="color:#b0b0cc;font-size:13px;">비밀번호 재설정 요청</p>
        </div>
        <div style="background:#1c1c30;padding:20px;border-radius:12px;margin-bottom:20px;">
          <p style="color:#b0b0cc;font-size:14px;margin:0 0 12px;">
            안녕하세요, <strong style="color:#8b7bf7;">${nickname}</strong>님!
          </p>
          <p style="color:#b0b0cc;font-size:13px;margin:0 0 16px;">
            아래 버튼을 클릭하면 새 비밀번호를 설정할 수 있어요.<br/>
            이 링크는 <strong>1시간</strong> 동안만 유효합니다.
          </p>
          <div style="text-align:center;">
            <a href="${resetLink}"
               style="display:inline-block;background:#8b7bf7;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
              🔮 비밀번호 재설정
            </a>
          </div>
        </div>
        <p style="color:#666680;font-size:11px;text-align:center;">
          본인이 요청하지 않았다면 이 메일을 무시해주세요.
        </p>
      </div>
    `,
  })
}
