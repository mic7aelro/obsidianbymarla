'use client'

import { useEffect, useRef, useState } from 'react'
import type { Inquiry, InquiryStatus, InquiryEvent, EventStatus } from '@/types/inquiry'
import CreateEventModal from './CreateEventModal'

const STATUS_ORDER: InquiryStatus[] = ['pending', 'reviewed']

const STATUS_COLORS: Record<InquiryStatus, string> = {
  pending: 'rgba(255,200,50,0.7)',
  reviewed: 'rgba(100,160,255,0.7)',
}

const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
}

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  awaiting_deposit: 'rgba(255,200,50,0.7)',
  confirmed: 'rgba(100,220,120,0.7)',
  completed: 'rgba(255,255,255,0.3)',
}

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
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
    <div style={{ marginTop: '12px', borderTop: '1px solid #1e1e1e', paddingTop: '10px' }}>
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

function InquiryEvents({ inquiryId }: { inquiryId: string }) {
  const [events, setEvents] = useState<InquiryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/events?inquiryId=${inquiryId}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        setEvents(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [inquiryId])

  if (loading) return null

  const count = events.length

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a', paddingTop: '14px' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: count > 0 ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ ...labelStyle, marginBottom: 0, opacity: count > 0 ? 0.6 : 0.25, color: count > 0 ? '#fff' : undefined }}>
          {count === 0 ? 'No events' : `${count} event${count > 1 ? 's' : ''}`}
        </span>
        {count > 0 && (
          <>
            {events.map((e) => (
              <span
                key={e._id}
                style={{
                  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                  fontSize: '7px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: EVENT_STATUS_COLORS[e.status ?? 'awaiting_deposit'],
                  border: `1px solid ${EVENT_STATUS_COLORS[e.status ?? 'awaiting_deposit']}`,
                  padding: '2px 6px',
                }}
              >
                {EVENT_STATUS_LABELS[e.status ?? 'awaiting_deposit']}
              </span>
            ))}
            <span
              style={{
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                fontSize: '8px',
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              {expanded ? '▲' : '▼'}
            </span>
          </>
        )}
      </button>

      {expanded && count > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((e) => (
            <div
              key={e._id}
              style={{
                background: '#111',
                border: '1px solid #222',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
              }}
            >
              <div>
                <p style={labelStyle}>Service</p>
                <p style={{ ...valueStyle, fontSize: '12px' }}>{e.service}</p>
              </div>
              <div>
                <p style={labelStyle}>Date</p>
                <p style={{ ...valueStyle, fontSize: '12px', opacity: 0.6 }}>
                  {e.date
                    ? new Date(e.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
              <div>
                <p style={labelStyle}>Status</p>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                    fontSize: '7px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: EVENT_STATUS_COLORS[e.status ?? 'awaiting_deposit'],
                    border: `1px solid ${EVENT_STATUS_COLORS[e.status ?? 'awaiting_deposit']}`,
                    padding: '2px 6px',
                  }}
                >
                  {EVENT_STATUS_LABELS[e.status ?? 'awaiting_deposit']}
                </span>
                {e.depositPaid && (
                  <p style={{ ...labelStyle, marginTop: '6px', marginBottom: 0, color: 'rgba(100,220,120,0.6)', opacity: 1 }}>
                    Deposit paid
                  </p>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <EventNotes event={e} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DeleteConfirmModal({
  inquiry,
  onClose,
  onDeleted,
}: {
  inquiry: Inquiry
  onClose: () => void
  onDeleted: () => void
}) {
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (typed !== 'DELETE') return
    setDeleting(true)
    await fetch('/api/admin/inquiries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inquiry._id }),
    })
    onDeleted()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          border: '1px solid #2a2a2a',
          padding: '40px 44px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-sans, "DM Sans", sans-serif)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,80,80,0.8)' }}>
          Delete Inquiry
        </p>
        <p style={{ fontFamily: 'var(--font-sans, "DM Sans", sans-serif)', fontSize: '13px', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
          This will permanently delete the inquiry from{' '}
          <span style={{ color: '#fff' }}>{inquiry.name}</span>. This action cannot be undone.
        </p>
        <div>
          <p style={{ fontFamily: 'var(--font-sans, "DM Sans", sans-serif)', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '8px' }}>
            Type DELETE to confirm
          </p>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            style={{
              width: '100%',
              background: '#111',
              border: '1px solid #2a2a2a',
              color: '#fff',
              fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
              fontSize: '13px',
              letterSpacing: '0.1em',
              padding: '10px 14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-sans, "DM Sans", sans-serif)', fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', padding: '9px 18px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={typed !== 'DELETE' || deleting}
            style={{
              background: typed === 'DELETE' ? 'rgba(255,60,60,0.15)' : 'transparent',
              border: `1px solid ${typed === 'DELETE' ? 'rgba(255,60,60,0.6)' : 'rgba(255,255,255,0.1)'}`,
              color: typed === 'DELETE' ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.2)',
              fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
              fontSize: '8px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              padding: '9px 18px',
              cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DotsMenu({
  inquiry,
  onEditStatus,
  onArchive,
  onUnarchive,
  onDelete,
  isArchived,
}: {
  inquiry: Inquiry
  onEditStatus: (s: InquiryStatus) => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
  isArchived: boolean
}) {
  const [open, setOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const menuItem = (
    label: string,
    onClick: () => void,
    color = 'rgba(255,255,255,0.75)'
  ): React.ReactNode => (
    <button
      onClick={() => { onClick(); setOpen(false); setStatusOpen(false) }}
      style={{
        display: 'block',
        width: '100%',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
        fontSize: '9px',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color,
        padding: '9px 16px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen((v) => !v); setStatusOpen(false) }}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.5)',
          width: '32px',
          height: '32px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
        title="Actions"
      >
        ···
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '38px',
            right: 0,
            background: '#111',
            border: '1px solid #2a2a2a',
            zIndex: 50,
            minWidth: '160px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Edit Status — shows submenu inline */}
          <div>
            <button
              onClick={() => setStatusOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                fontSize: '9px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.75)',
                padding: '9px 16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span>Edit Status</span>
              <span style={{ opacity: 0.4, fontSize: '8px' }}>{statusOpen ? '▲' : '▶'}</span>
            </button>
            {statusOpen && (
              <div style={{ borderTop: '1px solid #222', background: '#0d0d0d' }}>
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onEditStatus(s); setOpen(false); setStatusOpen(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      background: inquiry.status === s ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                      fontSize: '9px',
                      letterSpacing: '0.25em',
                      textTransform: 'uppercase',
                      color: STATUS_COLORS[s],
                      padding: '8px 16px 8px 24px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = inquiry.status === s ? 'rgba(255,255,255,0.06)' : 'transparent')}
                  >
                    {inquiry.status === s && <span style={{ fontSize: '7px' }}>✓</span>}
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #1e1e1e' }} />

          {!isArchived && menuItem('Archive', onArchive, 'rgba(255,255,255,0.45)')}
          {isArchived && menuItem('Unarchive', onUnarchive, 'rgba(255,255,255,0.45)')}

          <div style={{ borderTop: '1px solid #1e1e1e' }} />

          {menuItem('Delete', onDelete, 'rgba(255,80,80,0.7)')}
        </div>
      )}
    </div>
  )
}

export default function InquiriesTab({ onEventCreated }: { onEventCreated: () => void }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null)
  const [search, setSearch] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  // track which inquiry just had an event created so its panel refreshes
  const [refreshKey, setRefreshKey] = useState<Record<string, number>>({})

  async function load(archived = false) {
    setLoading(true)
    const res = await fetch(`/api/admin/inquiries?archived=${archived}`)
    const data = await res.json()
    setInquiries(data)
    setLoading(false)
  }

  useEffect(() => { load(showArchive) }, [showArchive])

  async function updateStatus(id: string, status: InquiryStatus) {
    await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setInquiries((prev) => prev.map((i) => (i._id === id ? { ...i, status } : i)))
  }

  async function archive(id: string) {
    await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: true }),
    })
    setInquiries((prev) => prev.filter((i) => i._id !== id))
  }

  async function unarchive(id: string) {
    await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, archived: false }),
    })
    setInquiries((prev) => prev.filter((i) => i._id !== id))
  }

  const filtered = inquiries.filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.service.toLowerCase().includes(q)
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
          {showArchive ? '← Active' : 'Archive'}
        </button>
      </div>

      {loading ? (
        <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ ...labelStyle, opacity: 0.3, fontSize: '11px' }}>
          {showArchive ? 'No archived inquiries.' : 'No inquiries yet.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {filtered.map((inquiry) => (
            <div
              key={inquiry._id}
              style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                padding: '28px 32px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '24px',
                  alignItems: 'center',
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
                  {inquiry.location && (
                    <p style={{ ...valueStyle, opacity: 0.35, fontSize: '11px' }}>{inquiry.location}</p>
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

                {/* Date + Status badge */}
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
                    <span
                      style={{
                        fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                        fontSize: '8px',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: STATUS_COLORS[inquiry.status],
                        border: `1px solid ${STATUS_COLORS[inquiry.status]}`,
                        padding: '3px 8px',
                      }}
                    >
                      {STATUS_LABELS[inquiry.status]}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {!showArchive && (
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
                      + Create Event
                    </button>
                  )}
                  <DotsMenu
                    inquiry={inquiry}
                    isArchived={showArchive}
                    onEditStatus={(s) => updateStatus(inquiry._id!, s)}
                    onArchive={() => archive(inquiry._id!)}
                    onUnarchive={() => unarchive(inquiry._id!)}
                    onDelete={() => setDeleteTarget(inquiry)}
                  />
                </div>
              </div>

              {/* Inline events panel */}
              <InquiryEvents
                key={`${inquiry._id}-${refreshKey[inquiry._id!] ?? 0}`}
                inquiryId={inquiry._id!}
              />
            </div>
          ))}
        </div>
      )}

      {selectedInquiry && (
        <CreateEventModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onCreated={() => {
            // bump refresh key for that inquiry's event panel
            setRefreshKey((prev) => ({
              ...prev,
              [selectedInquiry._id!]: (prev[selectedInquiry._id!] ?? 0) + 1,
            }))
            setSelectedInquiry(null)
            onEventCreated()
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          inquiry={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setInquiries((prev) => prev.filter((i) => i._id !== deleteTarget._id))
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}
