'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  letterSpacing: '0.05em',
  padding: '0.75rem 0',
  outline: 'none',
  transition: 'border-color 400ms cubic-bezier(0.16, 1, 0.3, 1)',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  opacity: 0.4,
  display: 'block',
  marginBottom: '0.5rem',
}

const SERVICES = [
  'Wedding Photography — Engagement ($350)',
  'Wedding Photography — Elopement ($900)',
  'Wedding Photography — Full Day (from $2,500)',
  'Personal Styling ($150/hr)',
  'Brand Styling (from $500)',
  'Personal Portraits ($250)',
  'Headshots ($150)',
  'Commercial Photography (from $500)',
  'Personal Shopping (10%)',
  'Custom / Other',
]

const CATEGORY_TO_SERVICE: Record<string, string> = {
  'Wedding Photography': 'Wedding Photography — Engagement ($350)',
  'Styling': 'Personal Styling ($150/hr)',
  'Photography': 'Personal Portraits ($250)',
  'Personal Shopping': 'Personal Shopping (10%)',
}

export default function ContactForm() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })

  useEffect(() => {
    const category = searchParams.get('service')
    if (category && CATEGORY_TO_SERVICE[category]) {
      setForm(prev => ({ ...prev, service: CATEGORY_TO_SERVICE[category] }))
    }
  }, [searchParams])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 300,
          letterSpacing: '0.06em',
          opacity: 0.7,
        }}
      >
        Thank you. We&apos;ll be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <label htmlFor="name" style={labelStyle}>Name *</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={set('name')}
            style={inputStyle}
            onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.6)')}
            onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
          />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>Email *</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={set('email')}
            style={inputStyle}
            onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.6)')}
            onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
          />
        </div>
      </div>

      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <label htmlFor="phone" style={labelStyle}>Phone</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            style={inputStyle}
            onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.6)')}
            onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
          />
        </div>
        <div>
          <label htmlFor="service" style={labelStyle}>Service *</label>
          <select
            id="service"
            required
            value={form.service}
            onChange={set('service')}
            style={{
              ...inputStyle,
              appearance: 'none',
              cursor: 'pointer',
              color: form.service ? '#fff' : 'rgba(255,255,255,0.3)',
            }}
            onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.6)')}
            onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
          >
            <option value="" disabled style={{ background: '#000' }}>Select a service</option>
            {SERVICES.map(s => (
              <option key={s} value={s} style={{ background: '#000' }}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" style={labelStyle}>Your vision *</label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={set('message')}
          style={{
            ...inputStyle,
            resize: 'none',
            lineHeight: 1.7,
          }}
          onFocus={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.6)')}
          onBlur={e => (e.target.style.borderBottomColor = 'rgba(255,255,255,0.15)')}
        />
      </div>

      {status === 'error' && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', opacity: 0.5 }}>
          Something went wrong. Please try again or reach out on Instagram.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          padding: '1rem 2rem',
          cursor: status === 'sending' ? 'wait' : 'pointer',
          opacity: status === 'sending' ? 0.4 : 0.8,
          transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => { if (status !== 'sending') e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { if (status !== 'sending') e.currentTarget.style.opacity = '0.8' }}
      >
        {status === 'sending' ? 'Sending…' : 'Send Inquiry'}
      </button>
    </form>
  )
}
