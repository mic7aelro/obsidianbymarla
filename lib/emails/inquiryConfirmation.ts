interface InquiryConfirmationProps {
  name: string
  service: string
}

export function inquiryConfirmationHtml({
  name,
  service,
}: InquiryConfirmationProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { background: #000; color: #fff; font-family: Georgia, serif; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 48px 32px; }
    h1 { font-size: 22px; font-weight: 300; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 32px; }
    p { font-size: 14px; line-height: 1.8; opacity: 0.8; margin: 0 0 20px; }
    .label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.4; margin-bottom: 4px; margin-top: 32px; }
    .value { font-size: 14px; }
    .footer { margin-top: 48px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.3; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Thank You, ${name}</h1>
    <p>Your inquiry has been received. Marla will be in touch within 1–2 business days to discuss your project.</p>
    <div class="label">Service requested</div>
    <div class="value">${service}</div>
    <p style="margin-top: 32px;">In the meantime, feel free to explore more of Marla's work on Instagram — <a href="https://instagram.com/marlizzlle" style="color:#000;">@marlizzlle</a></p>
    <div class="footer">Marla McLeod — Fashion Stylist &amp; Photographer</div>
  </div>
</body>
</html>
  `.trim()
}

export function inquiryConfirmationText({
  name,
  service,
}: InquiryConfirmationProps): string {
  return [
    `Thank you, ${name}.`,
    '',
    'Your inquiry has been received. Marla will be in touch within 1–2 business days to discuss your project.',
    '',
    `Service requested: ${service}`,
    '',
    'Instagram: @marlizzlle',
    '',
    'Marla McLeod — Fashion Stylist & Photographer',
  ].join('\n')
}
