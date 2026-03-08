'use client'

import { useEffect, useState } from 'react'
import type { InquiryEvent } from '@/types/inquiry'

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  opacity: 0.4,
  marginBottom: '4px',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '13px',
  lineHeight: 1.6,
  color: '#fff',
}

const actionBtn = (variant: 'primary' | 'ghost' = 'ghost'): React.CSSProperties => ({
  background: variant === 'primary' ? '#fff' : 'transparent',
  border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.2)',
  color: variant === 'primary' ? '#000' : '#fff',
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '8px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  padding: '8px 14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap' as const,
})

export default function EventsTab() {
  const [events, setEvents] = useState<InquiryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/events')
    const data = await res.json()
    setEvents(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markDepositPaid(id: string) {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, depositPaid: true }),
    })
    setEvents((prev) =>
      prev.map((e) => (e._id === id ? { ...e, depositPaid: true } : e))
    )
  }

  async function sendInvoice(eventId: string) {
    setSendingInvoice(eventId)
    const res = await fetch('/api/admin/events/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) =>
          e._id === eventId ? { ...e, invoiceSentAt: new Date() } : e
        )
      )
    }
    setSendingInvoice(null)
  }

  if (loading) {
    return <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>Loading...</p>
  }

  if (events.length === 0) {
    return (
      <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>
        No events yet. Create one from an inquiry.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {events.map((event) => (
        <div
          key={event._id}
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '28px 32px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr auto',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Client */}
          <div>
            <p style={labelStyle}>Client</p>
            <p style={valueStyle}>{event.clientName}</p>
            <p style={{ ...valueStyle, opacity: 0.5, fontSize: '11px' }}>{event.clientEmail}</p>
          </div>

          {/* Service + Date */}
          <div>
            <p style={labelStyle}>Service</p>
            <p style={valueStyle}>{event.service}</p>
            {event.date && (
              <>
                <p style={{ ...labelStyle, marginTop: '12px' }}>Date</p>
                <p style={{ ...valueStyle, fontSize: '12px', opacity: 0.7 }}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </>
            )}
          </div>

          {/* Deposit + Invoice status */}
          <div>
            <p style={labelStyle}>Deposit</p>
            <span
              style={{
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                fontSize: '8px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: event.depositPaid ? 'rgba(100,220,120,0.8)' : 'rgba(255,200,50,0.7)',
                border: `1px solid ${event.depositPaid ? 'rgba(100,220,120,0.4)' : 'rgba(255,200,50,0.35)'}`,
                padding: '3px 8px',
              }}
            >
              {event.depositPaid ? 'Paid' : 'Pending'}
            </span>

            {event.invoiceSentAt && (
              <>
                <p style={{ ...labelStyle, marginTop: '12px' }}>Invoice sent</p>
                <p style={{ ...valueStyle, fontSize: '11px', opacity: 0.5 }}>
                  {new Date(event.invoiceSentAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {!event.depositPaid && (
              <button onClick={() => markDepositPaid(event._id!)} style={actionBtn('primary')}>
                Mark Deposit Paid
              </button>
            )}
            <button
              onClick={() => sendInvoice(event._id!)}
              disabled={sendingInvoice === event._id}
              style={{
                ...actionBtn('ghost'),
                opacity: sendingInvoice === event._id ? 0.5 : 1,
              }}
            >
              {sendingInvoice === event._id
                ? 'Sending...'
                : event.invoiceSentAt
                ? 'Resend Invoice'
                : 'Send Invoice'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
