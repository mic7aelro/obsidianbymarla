interface InquiryNotificationProps {
  name: string
  email: string
  phone?: string
  service: string
  message: string
}

export function inquiryNotificationHtml({
  name,
  email,
  phone,
  service,
  message,
}: InquiryNotificationProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { background: #000; color: #fff; font-family: Georgia, serif; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 48px 32px; }
    .label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.4; margin-bottom: 4px; }
    .value { font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0; }
    h1 { font-size: 22px; font-weight: 300; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 40px; }
    .cta { display: inline-block; margin-top: 32px; padding: 14px 28px; border: 1px solid rgba(255,255,255,0.25); color: #fff; text-decoration: none; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>New Inquiry</h1>
    <div class="label">Name</div>
    <div class="value">${name}</div>
    <div class="label">Email</div>
    <div class="value">${email}</div>
    ${phone ? `<div class="label">Phone</div><div class="value">${phone}</div>` : ''}
    <div class="label">Service</div>
    <div class="value">${service}</div>
    <hr class="divider" />
    <div class="label">Message</div>
    <div class="value">${message.replace(/\n/g, '<br/>')}</div>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" class="cta">View in Admin</a>
  </div>
</body>
</html>
  `.trim()
}

export function inquiryNotificationText({
  name,
  email,
  phone,
  service,
  message,
}: InquiryNotificationProps): string {
  return [
    'NEW INQUIRY — MARLA McLEOD',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    `Service: ${service}`,
    '',
    'Message:',
    message,
    '',
    `View in admin: ${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}
