'use client'

import { useState, useCallback } from 'react'
import InquiriesTab from './InquiriesTab'
import EventsTab from './EventsTab'

type Tab = 'inquiries' | 'events'

const tabStyle = (active: boolean): React.CSSProperties => ({
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '1px solid #fff' : '1px solid transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.35)',
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  padding: '8px 0',
  marginRight: '32px',
  cursor: 'pointer',
  transition: 'color 0.2s, border-color 0.2s',
})

export default function AdminShell() {
  const [tab, setTab] = useState<Tab>('inquiries')

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const goToEvents = useCallback(() => setTab('events'), [])

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #1e1e1e',
          padding: '24px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: '16px',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#fff',
          }}
        >
          Marla McLeod — Admin
        </span>

        <a
          href="/admin/curate"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '8px 16px',
            marginRight: '16px',
            textDecoration: 'none',
          }}
        >
          Curate Gallery
        </a>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
            fontSize: '9px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      {/* Tabs */}
      <div style={{ padding: '32px 40px 0' }}>
        <button style={tabStyle(tab === 'inquiries')} onClick={() => setTab('inquiries')}>
          Inquiries
        </button>
        <button style={tabStyle(tab === 'events')} onClick={() => setTab('events')}>
          Events
        </button>
      </div>

      {/* Content */}
      <main style={{ padding: '40px' }}>
        {tab === 'inquiries' && <InquiriesTab onEventCreated={goToEvents} />}
        {tab === 'events' && <EventsTab />}
      </main>
    </div>
  )
}
