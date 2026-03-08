'use client'

import { useEffect, useState } from 'react'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'
import CreateEventModal from './CreateEventModal'

const STATUS_ORDER: InquiryStatus[] = [
  'pending',
  'reviewed',
  'awaiting_deposit',
  'confirmed',
  'completed',
]

const STATUS_COLORS: Record<InquiryStatus, string> = {
  pending: 'rgba(255,200,50,0.7)',
  reviewed: 'rgba(100,160,255,0.7)',
  awaiting_deposit: 'rgba(255,140,50,0.7)',
  confirmed: 'rgba(100,220,120,0.7)',
  completed: 'rgba(255,255,255,0.3)',
}

const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  awaiting_deposit: 'Awaiting Deposit',
  confirmed: 'Confirmed',
  completed: 'Completed',
}

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

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
        fontSize: '8px',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}`,
        padding: '3px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function StatusSelect({
  value,
  onChange,
}: {
  value: InquiryStatus
  onChange: (v: InquiryStatus) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as InquiryStatus)}
      style={{
        background: '#111',
        border: '1px solid #2a2a2a',
        color: '#fff',
        fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
        fontSize: '9px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '6px 10px',
        cursor: 'pointer',
        outline: 'none',
        WebkitAppearance: 'none',
        appearance: 'none',
        colorScheme: 'dark',
      }}
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}

export default function InquiriesTab({ onEventCreated }: { onEventCreated: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)

  async function load() {
    const res = await fetch('/api/admin/inquiries')
    const data = await res.json()
    setInquiries(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: InquiryStatus) {
    await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setInquiries((prev) =>
      prev.map((i) => (i._id === id ? { ...i, status } : i))
    )
  }

  if (loading) {
    return (
      <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>Loading...</p>
    )
  }

  if (inquiries.length === 0) {
    return (
      <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>No inquiries yet.</p>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {inquiries.map((inquiry) => (
          <div
            key={inquiry._id}
            style={{
              background: '#0a0a0a',
              border: '1px solid #1a1a1a',
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
              <p style={valueStyle}>{inquiry.name}</p>
              <p style={{ ...valueStyle, opacity: 0.5, fontSize: '11px' }}>{inquiry.email}</p>
              {inquiry.phone && (
                <p style={{ ...valueStyle, opacity: 0.4, fontSize: '11px' }}>{inquiry.phone}</p>
              )}
            </div>

            {/* Service + Message */}
            <div>
              <p style={labelStyle}>Service</p>
              <p style={valueStyle}>{inquiry.service}</p>
              <p style={{ ...valueStyle, opacity: 0.45, fontSize: '12px', marginTop: '8px' }}>
                {inquiry.message.length > 120
                  ? inquiry.message.slice(0, 120) + '…'
                  : inquiry.message}
              </p>
            </div>

            {/* Date + Status */}
            <div>
              <p style={labelStyle}>Received</p>
              <p style={{ ...valueStyle, fontSize: '12px', opacity: 0.6 }}>
                {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <div style={{ marginTop: '12px' }}>
                <StatusBadge status={inquiry.status} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <StatusSelect
                value={inquiry.status}
                onChange={(s) => updateStatus(inquiry._id!, s)}
              />
              {inquiry.status !== 'awaiting_deposit' &&
                inquiry.status !== 'confirmed' &&
                inquiry.status !== 'completed' && (
                  <button
                    onClick={() => setSelectedInquiry(inquiry)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                      fontSize: '8px',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Create Event
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {selectedInquiry && (
        <CreateEventModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onCreated={() => {
            setSelectedInquiry(null)
            load()
            onEventCreated()
          }}
        />
      )}
    </>
  )
}
