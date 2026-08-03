export function adminOtpHtml(code: string) {
  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#050505;color:#f2f0ec;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:64px 32px;">
          <p style="font-family:Georgia,serif;font-size:24px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 32px;">
            Obsidian by Marla
          </p>
          <p style="font-size:14px;line-height:1.8;color:#b8b6b1;margin:0 0 28px;">
            Enter this code to sign in to the admin portal. It expires in 5 minutes.
          </p>
          <div style="font-family:Georgia,serif;font-size:42px;letter-spacing:0.28em;margin:0 0 28px;">
            ${code}
          </div>
          <p style="font-size:12px;line-height:1.7;color:#777570;margin:0;">
            If you did not request this code, you can ignore this email.
          </p>
        </div>
      </body>
    </html>
  `
}

export function adminOtpText(code: string) {
  return [
    `Your Obsidian by Marla admin sign-in code: ${code}`,
    '',
    'It expires in 5 minutes.',
    '',
    'If you did not request this code, you can ignore this email.',
  ].join('\n')
}
