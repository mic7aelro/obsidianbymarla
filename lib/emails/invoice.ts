interface InvoiceProps {
  clientName: string
  clientEmail: string
  service: string
  date?: string
}

export function invoiceHtml({ clientName, service, date }: InvoiceProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { background: #000; color: #fff; font-family: Georgia, serif; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 48px 32px; }
    h1 { font-size: 22px; font-weight: 300; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 8px; }
    .sub { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.4; margin: 0 0 48px; }
    .label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.4; margin-bottom: 4px; margin-top: 28px; }
    .value { font-size: 14px; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0; }
    .payment-box { border: 1px solid rgba(255,255,255,0.15); padding: 24px; margin-top: 32px; }
    .payment-title { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; opacity: 0.5; margin-bottom: 16px; }
    .payment-method { font-size: 13px; line-height: 1.8; }
    .footer { margin-top: 48px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.3; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Invoice</h1>
    <p class="sub">Marla McLeod — Fashion Stylist &amp; Photographer</p>

    <div class="label">Client</div>
    <div class="value">${clientName}</div>

    <div class="label">Service</div>
    <div class="value">${service}</div>

    ${date ? `<div class="label">Date</div><div class="value">${date}</div>` : ''}

    <hr class="divider" />

    <div class="payment-box">
      <div class="payment-title">Deposit Payment Instructions</div>
      <div class="payment-method">
        A 10% deposit is required to confirm your booking.<br /><br />
        <strong>Venmo:</strong> @marlizzlle<br />
        <strong>Zelle:</strong> obsidianstudiosco@gmail.com<br /><br />
        Please include your name and service in the payment note.<br />
        Once your deposit is received, your booking will be confirmed.
      </div>
    </div>

    <p style="margin-top: 32px; font-size: 13px; line-height: 1.8; opacity: 0.7;">
      Questions? Reply to this email or reach out on Instagram — <a href="https://instagram.com/marlizzlle" style="color: #fff;">@marlizzlle</a>
    </p>

    <div class="footer">Marla McLeod — obsidianstudiosco@gmail.com</div>
  </div>
</body>
</html>
  `.trim()
}

export function invoiceText({ clientName, service, date }: InvoiceProps): string {
  return [
    'INVOICE — MARLA McLEOD',
    '',
    `Client: ${clientName}`,
    `Service: ${service}`,
    date ? `Date: ${date}` : null,
    '',
    'DEPOSIT PAYMENT INSTRUCTIONS',
    'A 10% deposit is required to confirm your booking.',
    '',
    'Venmo: @marlizzlle',
    'Zelle: obsidianstudiosco@gmail.com',
    '',
    'Please include your name and service in the payment note.',
    'Once your deposit is received, your booking will be confirmed.',
    '',
    'Marla McLeod — obsidianstudiosco@gmail.com',
  ]
    .filter((l) => l !== null)
    .join('\n')
}
