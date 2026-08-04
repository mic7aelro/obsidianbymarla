'use client'

import { useCallback, useEffect, useState } from 'react'
import styles from './CurateShell.module.css'

interface BlobUsage {
  usedBytes: number
  limitBytes: number
  blobCount: number
  measuredAt: string
}

function formatBytes(bytes: number) {
  if (bytes < 1_000_000) return `${Math.max(0.1, bytes / 1_000).toFixed(1)} KB`
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`
}

export default function BlobUsageMeter() {
  const [usage, setUsage] = useState<BlobUsage | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadUsage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/blob-usage', { cache: 'no-store' })
      if (!response.ok) throw new Error('Storage usage is unavailable')
      setUsage(await response.json() as BlobUsage)
    } catch (usageError) {
      setError(usageError instanceof Error ? usageError.message : 'Storage usage is unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadUsage() }, [loadUsage])

  const percentage = usage
    ? Math.min(100, Math.max(0, (usage.usedBytes / usage.limitBytes) * 100))
    : 0

  return (
    <section className={styles.storagePanel} aria-labelledby="blob-storage-title">
      <div className={styles.storageHeading}>
        <div>
          <p id="blob-storage-title" className={styles.storageEyebrow}>Blob storage</p>
          <p className={styles.storageValue}>
            {loading && !usage ? 'Measuring…' : usage ? `${formatBytes(usage.usedBytes)} / ${formatBytes(usage.limitBytes)}` : 'Unavailable'}
          </p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void loadUsage()} disabled={loading}>
          {loading ? 'Checking' : 'Refresh'}
        </button>
      </div>
      <div className={styles.storageTrack} aria-hidden="true">
        <span className={styles.storageFill} style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
      <div className={styles.storageMeta}>
        <span>{usage ? `${usage.blobCount} files · ${percentage.toFixed(1)}% of allowance` : error}</span>
        <span>Current snapshot · allowance is measured as a monthly average</span>
      </div>
    </section>
  )
}
