'use client'

import { useState, useCallback } from 'react'
import InquiriesTab from './InquiriesTab'
import EventsTab from './EventsTab'
import CalendarTab from './CalendarTab'
import styles from './AdminShell.module.css'

type Tab = 'inquiries' | 'events' | 'calendar'

export default function AdminShell() {
  const [tab, setTab] = useState<Tab>('inquiries')

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const goToEvents = useCallback(() => setTab('events'), [])

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a
          href="https://www.obsidianbymarla.com/"
          className={styles.brand}
        >
          <span>Obsidian by Marla</span>
          <span className={styles.adminLabel}>Admin</span>
        </a>

        <div className={styles.headerLinks}>
          <a
            href="/admin/curate"
            className={styles.headerLink}
          >
            Curate Gallery
          </a>
          <a
            href="/plan"
            className={styles.headerLinkPrimary}
          >
            Plan Feed
          </a>
        </div>

        <div className={styles.signOutWrap}>
          <button
            onClick={handleLogout}
            className={styles.signOut}
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Admin sections">
        <button className={`${styles.tab} ${tab === 'inquiries' ? styles.tabActive : ''}`} onClick={() => setTab('inquiries')}>
          Inquiries
        </button>
        <button className={`${styles.tab} ${tab === 'events' ? styles.tabActive : ''}`} onClick={() => setTab('events')}>
          Events
        </button>
        <button className={`${styles.tab} ${tab === 'calendar' ? styles.tabActive : ''}`} onClick={() => setTab('calendar')}>
          Calendar
        </button>
      </nav>

      <main className={styles.content}>
        {tab === 'inquiries' && <InquiriesTab onEventCreated={goToEvents} />}
        {tab === 'events' && <EventsTab />}
        {tab === 'calendar' && <CalendarTab />}
      </main>
    </div>
  )
}
