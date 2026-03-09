'use client'

import { useState, FormEvent } from 'react'
import type { Inquiry } from '@/types/inquiry'

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '13px',
  padding: '8px 0',
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: '#fff',
  opacity: 0.45,
  marginBottom: '6px',
  display: 'block',
}

export default function CreateEventModal({
  inquiry,
  onClose,
  onCreated,
}: {
  inquiry: Inquiry
  onClose: () => void
  onCreated: () => void
}) {
  const [date, setDate] = useState('')
  const [location, setLocation] = useState(inquiry.location ?? '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inquiryId: inquiry._id,
        clientName: inquiry.name,
        clientEmail: inquiry.email,
        service: inquiry.service,
        date: date || undefined,
        location: location || undefined,
        notes: notes || undefined,
      }),
    })

    if (res.ok) {
      onCreated()
    } else {
      setError('Failed to create event')
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '48px',
          width: '100%',
          maxWidth: '480px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: '20px',
            fontWeight: 300,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#fff',
            margin: '0 0 8px',
          }}
        >
          Create Event
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
            fontSize: '12px',
            opacity: 0.45,
            margin: '0 0 40px',
          }}
        >
          {inquiry.name} — {inquiry.service}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <label style={labelStyle}>Date (optional)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Payment details, special requests, reminders…"
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: '1.6',
              }}
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'rgba(255,100,100,0.8)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#fff',
                border: 'none',
                color: '#000',
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                fontSize: '9px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                padding: '14px 24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                fontSize: '9px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                padding: '14px 24px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
