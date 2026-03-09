'use client'

import { useEffect, useState } from 'react'
import type { InquiryEvent, EventStatus } from '@/types/inquiry'

const STATUS_ORDER: EventStatus[] = ['awaiting_deposit', 'confirmed', 'completed']

const STATUS_COLORS: Record<EventStatus, string> = {
  awaiting_deposit: 'rgba(255,200,50,0.7)',
  confirmed: 'rgba(100,220,120,0.7)',
  completed: 'rgba(255,255,255,0.3)',
}

const STATUS_LABELS: Record<EventStatus, string> = {
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

function StatusSelect({
  value,
  depositPaid,
  onChange,
}: {
  value: EventStatus
  depositPaid: boolean
  onChange: (v: EventStatus) => void
}) {
  // If deposit is paid, awaiting_deposit is not a valid status
  const available = depositPaid
    ? STATUS_ORDER.filter((s) => s !== 'awaiting_deposit')
    : STATUS_ORDER

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EventStatus)}
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
      {available.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}

function EventNotes({ event }: { event: InquiryEvent }) {
  const [notes, setNotes] = useState(event.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useState<ReturnType<typeof setTimeout> | null>(null)

  async function save(value: string) {
    setSaving(true)
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event._id, notes: value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setNotes(value)
    setSaved(false)
    if (timerRef[0]) clearTimeout(timerRef[0])
    timerRef[0] = setTimeout(() => save(value), 800)
  }

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #1e1e1e', paddingTop: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <p style={{ ...labelStyle, marginBottom: 0 }}>Notes</p>
        {saving && <span style={{ ...labelStyle, marginBottom: 0, opacity: 0.3 }}>Saving…</span>}
        {saved && <span style={{ ...labelStyle, marginBottom: 0, color: 'rgba(100,220,120,0.6)', opacity: 1 }}>Saved</span>}
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Add notes…"
        rows={3}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #2a2a2a',
          color: '#fff',
          fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
          fontSize: '12px',
          lineHeight: 1.7,
          padding: '4px 0',
          outline: 'none',
          resize: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

export default function EventsTab() {
  const [events, setEvents] = useState<InquiryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showArchive, setShowArchive] = useState(false)

  async function load(archived = false) {
    setLoading(true)
    const res = await fetch(`/api/admin/events?archived=${archived}`)
    const data: InquiryEvent[] = await res.json()

    // Fix stale records: deposit paid but status still awaiting_deposit
    const corrected = data.map((e) => {
      if (e.depositPaid && (e.status === 'awaiting_deposit' || !e.status)) {
        // Persist the correction silently
        fetch('/api/admin/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: e._id, status: 'confirmed' }),
        })
        return { ...e, status: 'confirmed' as EventStatus }
      }
      return e
    })

    setEvents(corrected)
    setLoading(false)
  }

  useEffect(() => { load(showArchive) }, [showArchive])

  async function updateStatus(id: string, status: EventStatus) {
    const depositPaid = status === 'confirmed' || status === 'completed'
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, depositPaid }),
    })
    setEvents((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status, depositPaid } : e))
    )
  }

  async function markDepositPaid(id: string) {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, depositPaid: true }),
    })
    setEvents((prev) =>
      prev.map((e) => (e._id === id ? { ...e, depositPaid: true, status: 'confirmed' } : e))
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

  async function archive(id: string) {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: true }),
    })
    setEvents((prev) => prev.filter((e) => e._id !== id))
  }

  async function unarchive(id: string) {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: false }),
    })
    setEvents((prev) => prev.filter((e) => e._id !== id))
  }

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.clientName.toLowerCase().includes(q) ||
      e.clientEmail.toLowerCase().includes(q) ||
      e.service.toLowerCase().includes(q)
    )
  })

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or service…"
          style={{
            flex: 1,
            background: '#0a0a0a',
            border: '1px solid #2a2a2a',
            color: '#fff',
            fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
            fontSize: '12px',
            letterSpacing: '0.05em',
            padding: '10px 14px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => { setShowArchive((v) => !v); setSearch('') }}
          style={{
            background: 'transparent',
            border: `1px solid ${showArchive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
            color: showArchive ? '#fff' : 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
            fontSize: '8px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            padding: '10px 18px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {showArchive ? 'Active' : 'Archive'}
        </button>
      </div>

      {loading ? (
        <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>
          {showArchive ? 'No archived events.' : 'No events yet. Create one from an inquiry.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {filtered.map((event) => (
            <div
              key={event._id}
              style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                padding: '28px 32px',
              }}
            >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '24px', alignItems: 'start' }}>
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

              {/* Deposit + Invoice */}
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

                <p style={{ ...labelStyle, marginTop: '12px' }}>Status</p>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                    fontSize: '8px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: STATUS_COLORS[event.status ?? 'awaiting_deposit'],
                    border: `1px solid ${STATUS_COLORS[event.status ?? 'awaiting_deposit']}`,
                    padding: '3px 8px',
                  }}
                >
                  {STATUS_LABELS[event.status ?? 'awaiting_deposit']}
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
                {!showArchive && (
                  <>
                    <StatusSelect
                      value={event.status ?? 'awaiting_deposit'}
                      depositPaid={event.depositPaid}
                      onChange={(s) => updateStatus(event._id!, s)}
                    />
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
                    <button
                      onClick={() => archive(event._id!)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.35)',
                        fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                        fontSize: '8px',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        padding: '8px 14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Archive
                    </button>
                  </>
                )}
                {showArchive && (
                  <button
                    onClick={() => unarchive(event._id!)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                      fontSize: '8px',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Unarchive
                  </button>
                )}
              </div>
            </div>{/* end grid */}
            <EventNotes event={event} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
