import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, service, message } = body

  if (!name || !email || !service || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // TODO: wire up email provider (Resend, SendGrid, etc.)
  // Example with Resend:
  // await resend.emails.send({
  //   from: 'noreply@marlamcleod.com',
  //   to: process.env.CONTACT_EMAIL!,
  //   subject: `New inquiry from ${name} — ${service}`,
  //   text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\n\n${message}`,
  // })

  console.log('Contact form submission:', { name, email, phone, service, message })

  return NextResponse.json({ ok: true })
}
