'use client'

import { useEffect, useMemo, useState } from 'react'
import type { EventStatus, InquiryEvent } from '@/types/inquiry'
import styles from './CalendarTab.module.css'

const DAY_MS = 86_400_000
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isBookedEvent(event: InquiryEvent) {
  return event.depositPaid || event.status === 'confirmed' || event.status === 'completed'
}

function dateKey(value: Date | string | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function keyFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00.000Z`)
}

function formatDate(key: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(dateFromKey(key))
}

function formatTime(value?: string) {
  if (!value) return null
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)))
}

function EventSettingsModal({
  event,
  onClose,
  onSaved,
}: {
  event: InquiryEvent
  onClose: () => void
  onSaved: (event: InquiryEvent) => void
}) {
  const [clientName, setClientName] = useState(event.clientName)
  const [clientEmail, setClientEmail] = useState(event.clientEmail)
  const [service, setService] = useState(event.service)
  const [date, setDate] = useState(dateKey(event.date) ?? '')
  const [time, setTime] = useState(event.time ?? '')
  const [location, setLocation] = useState(event.location ?? '')
  const [status, setStatus] = useState<EventStatus>(event.status)
  const [depositPaid, setDepositPaid] = useState(event.depositPaid)
  const [notes, setNotes] = useState(event.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function changeStatus(nextStatus: EventStatus) {
    setStatus(nextStatus)
    setDepositPaid(nextStatus !== 'awaiting_deposit')
  }

  function changeDeposit(paid: boolean) {
    setDepositPaid(paid)
    if (paid && status === 'awaiting_deposit') setStatus('confirmed')
    if (!paid && status !== 'awaiting_deposit') setStatus('awaiting_deposit')
  }

  async function save(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault()
    setSaving(true)
    setError('')

    const response = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event._id,
        clientName,
        clientEmail,
        service,
        date,
        time,
        location,
        status,
        depositPaid,
        notes,
      }),
    })

    if (!response.ok) {
      setError('The event could not be saved. Please try again.')
      setSaving(false)
      return
    }

    onSaved({
      ...event,
      clientName,
      clientEmail,
      service,
      date: date ? dateFromKey(date) : undefined,
      time: time || undefined,
      location: location || undefined,
      status,
      depositPaid,
      notes: notes || undefined,
      updatedAt: new Date(),
    })
  }

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-settings-heading"
        onMouseDown={modalEvent => modalEvent.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Event settings</p>
            <h2 id="event-settings-heading">{event.clientName}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close event settings">Close</button>
        </header>

        <form className={styles.modalForm} onSubmit={save}>
          <div className={styles.formGrid}>
            <label>
              <span>Client name</span>
              <input value={clientName} onChange={inputEvent => setClientName(inputEvent.target.value)} required />
            </label>
            <label>
              <span>Client email</span>
              <input type="email" value={clientEmail} onChange={inputEvent => setClientEmail(inputEvent.target.value)} required />
            </label>
          </div>

          <label>
            <span>Service</span>
            <input value={service} onChange={inputEvent => setService(inputEvent.target.value)} required />
          </label>

          <div className={styles.formGrid}>
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={inputEvent => setDate(inputEvent.target.value)} />
            </label>
            <label>
              <span>Time</span>
              <input type="time" value={time} onChange={inputEvent => setTime(inputEvent.target.value)} />
            </label>
          </div>

          <label>
            <span>Location</span>
            <input value={location} onChange={inputEvent => setLocation(inputEvent.target.value)} />
          </label>

          <div className={styles.formGrid}>
            <label>
              <span>Status</span>
              <select value={status} onChange={inputEvent => changeStatus(inputEvent.target.value as EventStatus)}>
                <option value="awaiting_deposit">Awaiting deposit</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={depositPaid} onChange={inputEvent => changeDeposit(inputEvent.target.checked)} />
              <span>Deposit paid</span>
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea value={notes} onChange={inputEvent => setNotes(inputEvent.target.value)} rows={4} />
          </label>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EventRow({ event, onOpen }: { event: InquiryEvent; onOpen: () => void }) {
  const key = dateKey(event.date)

  return (
    <article
      className={styles.eventRow}
      onClick={onOpen}
      onKeyDown={keyboardEvent => {
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') onOpen()
      }}
      role="button"
      tabIndex={0}
    >
      <div className={styles.eventDate}>
        {key ? (
          <>
            <span>{formatDate(key, { month: 'short' })}</span>
            <strong>{formatDate(key, { day: '2-digit' })}</strong>
            <small>{formatDate(key, { year: 'numeric' })}</small>
            {formatTime(event.time) && <em>{formatTime(event.time)}</em>}
          </>
        ) : (
          <span className={styles.unscheduled}>Date not set</span>
        )}
      </div>
      <div className={styles.eventIdentity}>
        <strong>{event.clientName}</strong>
        <span>{event.service}</span>
      </div>
      <div className={styles.eventMeta}>
        <span>{event.location || 'Location not set'}</span>
        <span>{event.clientEmail}</span>
      </div>
      <span className={`${styles.status} ${event.status === 'completed' ? styles.completed : styles.confirmed}`}>
        {event.status === 'completed' ? 'Completed' : 'Confirmed'}
      </span>
    </article>
  )
}

export default function CalendarTab() {
  const now = new Date()
  const [month, setMonth] = useState(() => new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)))
  const [events, setEvents] = useState<InquiryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingEvent, setEditingEvent] = useState<InquiryEvent | null>(null)

  async function loadEvents() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/events?archived=false', { cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to load calendar events.')
      const data: InquiryEvent[] = await response.json()
      setEvents(data)
    } catch {
      setError('The calendar could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const bookedEvents = useMemo(
    () => events.filter(isBookedEvent),
    [events]
  )

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, InquiryEvent[]>()
    bookedEvents.forEach((event) => {
      const key = dateKey(event.date)
      if (!key) return
      const dayEvents = grouped.get(key) ?? []
      dayEvents.push(event)
      grouped.set(key, dayEvents)
    })
    return grouped
  }, [bookedEvents])

  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const todayKey = keyFromParts(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const upcomingLimit = new Date(today.getTime() + 30 * DAY_MS)

  const upcomingEvents = useMemo(
    () => bookedEvents
      .filter((event) => {
        const key = dateKey(event.date)
        if (!key || event.status === 'completed') return false
        const date = dateFromKey(key)
        return date >= today && date <= upcomingLimit
      })
      .sort((a, b) => dateFromKey(dateKey(a.date)!).getTime() - dateFromKey(dateKey(b.date)!).getTime()),
    [bookedEvents, today.getTime(), upcomingLimit.getTime()]
  )

  const allEvents = useMemo(
    () => [...bookedEvents].sort((a, b) => {
      const aKey = dateKey(a.date)
      const bKey = dateKey(b.date)
      if (!aKey) return 1
      if (!bKey) return -1

      const aDate = dateFromKey(aKey).getTime()
      const bDate = dateFromKey(bKey).getTime()
      const aPast = aDate < today.getTime()
      const bPast = bDate < today.getTime()
      if (aPast !== bPast) return aPast ? 1 : -1
      return aPast ? bDate - aDate : aDate - bDate
    }),
    [bookedEvents, today.getTime()]
  )

  const year = month.getUTCFullYear()
  const monthIndex = month.getUTCMonth()
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const calendarDays = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - firstWeekday + 1
    return day > 0 && day <= daysInMonth ? day : null
  })

  function changeMonth(offset: number) {
    setMonth(current => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1)))
  }

  function saveEditedEvent(savedEvent: InquiryEvent) {
    setEvents(current => current.map(event => event._id === savedEvent._id ? savedEvent : event))
    setEditingEvent(null)
  }

  if (loading) {
    return <div className={styles.state}>Loading calendar...</div>
  }

  if (error) {
    return (
      <div className={styles.state}>
        <p>{error}</p>
        <button onClick={loadEvents}>Try again</button>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <section className={styles.calendarSection} aria-labelledby="calendar-heading">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Confirmed schedule</p>
            <h1 id="calendar-heading">Calendar</h1>
          </div>
          <div className={styles.monthControls}>
            <button onClick={() => changeMonth(-1)} aria-label="Previous month">Previous</button>
            <p>{formatDate(keyFromParts(year, monthIndex, 1), { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => changeMonth(1)} aria-label="Next month">Next</button>
          </div>
        </header>

        <div className={styles.calendarViewport}>
          <div className={styles.calendarGrid} role="grid" aria-label={`${formatDate(keyFromParts(year, monthIndex, 1), { month: 'long', year: 'numeric' })} calendar`}>
            {WEEKDAYS.map(day => <div className={styles.weekday} key={day} role="columnheader">{day}</div>)}
            {calendarDays.map((day, index) => {
              if (!day) return <div className={`${styles.day} ${styles.emptyDay}`} key={`empty-${index}`} role="gridcell" />
              const key = keyFromParts(year, monthIndex, day)
              const dayEvents = eventsByDate.get(key) ?? []

              return (
                <div className={`${styles.day} ${key === todayKey ? styles.today : ''}`} key={key} role="gridcell">
                  <time dateTime={key}>{day}</time>
                  <div className={styles.dayEvents}>
                    {dayEvents.slice(0, 3).map(event => (
                      <button
                        type="button"
                        className={`${styles.calendarEvent} ${event.status === 'completed' ? styles.calendarEventCompleted : ''}`}
                        key={event._id}
                        title={`${event.clientName}, ${event.service}`}
                        onClick={() => setEditingEvent(event)}
                      >
                        <strong>{event.clientName}</strong>
                        <span>{event.service}{formatTime(event.time) ? `, ${formatTime(event.time)}` : ''}</span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && <span className={styles.moreEvents}>+{dayEvents.length - 3} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className={styles.listSection} aria-labelledby="upcoming-heading">
        <header className={styles.listHeader}>
          <div>
            <p className={styles.eyebrow}>Next 30 days</p>
            <h2 id="upcoming-heading">Upcoming Events</h2>
          </div>
          <span>{upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'}</span>
        </header>
        {upcomingEvents.length > 0 ? (
          <div className={styles.eventList}>{upcomingEvents.map(event => <EventRow event={event} key={event._id} onOpen={() => setEditingEvent(event)} />)}</div>
        ) : (
          <p className={styles.emptyState}>No confirmed events in the next 30 days.</p>
        )}
      </section>

      <section className={styles.listSection} aria-labelledby="all-events-heading">
        <header className={styles.listHeader}>
          <div>
            <p className={styles.eyebrow}>Confirmed and completed</p>
            <h2 id="all-events-heading">All Events</h2>
          </div>
          <span>{allEvents.length} {allEvents.length === 1 ? 'event' : 'events'}</span>
        </header>
        {allEvents.length > 0 ? (
          <div className={styles.eventList}>{allEvents.map(event => <EventRow event={event} key={event._id} onOpen={() => setEditingEvent(event)} />)}</div>
        ) : (
          <p className={styles.emptyState}>No confirmed events yet.</p>
        )}
      </section>

      {editingEvent && (
        <EventSettingsModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={saveEditedEvent}
        />
      )}
    </div>
  )
}
