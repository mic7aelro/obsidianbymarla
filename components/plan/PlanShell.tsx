'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import { InstagramLogo } from '@phosphor-icons/react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import PlanDraftCard from './PlanDraftCard'
import type {
  InstagramFeedResponse,
  InstagramMedia,
  PlanBoardResponse,
  PlanDraft,
} from '@/types/plan'
import styles from './PlanShell.module.css'

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif'

function isImageCandidate(file: File) {
  return file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)
}

async function normalizeImage(file: File): Promise<File> {
  const looksLikeHeic = /\.(heic|heif)$/i.test(file.name) || /image\/(heic|heif)/i.test(file.type)
  if (!looksLikeHeic) return file

  const { heicTo, isHeic } = await import('heic-to/csp')
  if (!(await isHeic(file))) return file

  const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
  const name = file.name.replace(/\.(heic|heif)$/i, '') || 'photo'
  return new File([jpeg], `${name}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  })
}

async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error(`Could not read ${file.name}`))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function publishedImage(media: InstagramMedia) {
  return media.mediaType === 'VIDEO' && media.thumbnailUrl
    ? media.thumbnailUrl
    : media.mediaUrl
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Published post'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export default function PlanShell() {
  const [drafts, setDrafts] = useState<PlanDraft[]>([])
  const [gridOffset, setGridOffset] = useState(0)
  const [feed, setFeed] = useState<InstagramMedia[]>([])
  const [instagramConnected, setInstagramConnected] = useState(false)
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null)
  const [instagramMessage, setInstagramMessage] = useState('')
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [refreshingFeed, setRefreshingFeed] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selectedDraft = useMemo(
    () => drafts.find(draft => draft.id === selectedId) ?? null,
    [drafts, selectedId],
  )
  const activeDraft = drafts.find(draft => draft.id === activeId) ?? null

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    setCaption(selectedDraft?.caption ?? '')
  }, [selectedDraft])

  const handleUnauthorized = useCallback((response: Response) => {
    if (response.status !== 401) return false
    window.location.assign('/admin/login?next=/plan')
    return true
  }, [])

  const loadPlan = useCallback(async () => {
    setLoadingPlan(true)
    try {
      const response = await fetch('/api/plan', { cache: 'no-store' })
      if (handleUnauthorized(response)) return
      const data = await response.json() as PlanBoardResponse & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The planner could not be loaded.')
      setDrafts(data.drafts)
      setGridOffset(data.gridOffset)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'The planner could not be loaded.')
    } finally {
      setLoadingPlan(false)
    }
  }, [handleUnauthorized])

  const loadInstagram = useCallback(async (refresh = false) => {
    if (refresh) setRefreshingFeed(true)
    else setLoadingFeed(true)
    try {
      const response = await fetch('/api/plan/instagram', { cache: 'no-store' })
      if (handleUnauthorized(response)) return
      const data = await response.json() as InstagramFeedResponse & { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Instagram could not be loaded.')
      setFeed(data.items)
      setInstagramConnected(data.connected)
      setInstagramUsername(data.username)
      setInstagramMessage(data.message ?? '')
    } catch (feedError) {
      setInstagramConnected(false)
      setInstagramMessage(feedError instanceof Error ? feedError.message : 'Instagram could not be loaded.')
    } finally {
      setLoadingFeed(false)
      setRefreshingFeed(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    void loadPlan()
    void loadInstagram()
  }, [loadInstagram, loadPlan])

  async function addFiles(incoming: FileList | null) {
    const candidates = Array.from(incoming ?? []).filter(isImageCandidate).slice(0, 12)
    if (candidates.length === 0) return

    setError('')
    setUploading(true)
    try {
      const normalized: File[] = []
      for (let index = 0; index < candidates.length; index++) {
        setUploadStatus(`Preparing ${index + 1} of ${candidates.length}`)
        normalized.push(await normalizeImage(candidates[index]))
      }

      const items: Array<{
        mediaUrl: string
        width: number
        height: number
        fileName: string
      }> = []

      for (let index = 0; index < normalized.length; index++) {
        const file = normalized[index]
        const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
        setUploadStatus(`Uploading ${index + 1} of ${normalized.length}`)
        const [blob, dimensions] = await Promise.all([
          upload(`images/plan/${Date.now()}-${index}.${extension}`, file, {
            access: 'public',
            handleUploadUrl: '/api/admin/blob-upload',
            multipart: file.size > 5 * 1024 * 1024,
          }),
          imageDimensions(file),
        ])
        items.push({ mediaUrl: blob.url, ...dimensions, fileName: file.name })
      }

      setUploadStatus('Saving to planner')
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { drafts?: PlanDraft[]; error?: string }
      if (!response.ok || !data.drafts) throw new Error(data.error ?? 'The posts could not be added.')
      setDrafts(previous => [...data.drafts!, ...previous])
      setSelectedId(data.drafts[0]?.id ?? null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The posts could not be added.')
    } finally {
      setUploading(false)
      setUploadStatus('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function saveOrder(nextDrafts: PlanDraft[], previousDrafts: PlanDraft[]) {
    try {
      const response = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', ids: nextDrafts.map(draft => draft.id) }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The new order could not be saved.')
    } catch (saveError) {
      setDrafts(previousDrafts)
      setError(saveError instanceof Error ? saveError.message : 'The new order could not be saved.')
    }
  }

  function startDrag(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function finishDrag(event: DragEndEvent) {
    setActiveId(null)
    if (!event.over || event.active.id === event.over.id) return
    const from = drafts.findIndex(draft => draft.id === event.active.id)
    const to = drafts.findIndex(draft => draft.id === event.over!.id)
    if (from < 0 || to < 0) return
    const previous = drafts
    const next = arrayMove(drafts, from, to)
    setDrafts(next)
    void saveOrder(next, previous)
  }

  async function cycleGridOffset() {
    const previous = gridOffset
    const next = (gridOffset + 1) % 3
    setGridOffset(next)
    try {
      const response = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offset', gridOffset: next }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The grid shift could not be saved.')
    } catch (offsetError) {
      setGridOffset(previous)
      setError(offsetError instanceof Error ? offsetError.message : 'The grid shift could not be saved.')
    }
  }

  async function saveCaption() {
    if (!selectedDraft || savingCaption) return
    setSavingCaption(true)
    setError('')
    try {
      const response = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'caption', id: selectedDraft.id, caption }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The caption could not be saved.')
      setDrafts(previous => previous.map(draft => (
        draft.id === selectedDraft.id
          ? { ...draft, caption: caption.trim(), updatedAt: new Date().toISOString() }
          : draft
      )))
    } catch (captionError) {
      setError(captionError instanceof Error ? captionError.message : 'The caption could not be saved.')
    } finally {
      setSavingCaption(false)
    }
  }

  async function deleteDraft() {
    if (!selectedDraft || deleting) return
    const confirmed = window.confirm('Remove this planned post and its uploaded image?')
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/plan?id=${encodeURIComponent(selectedDraft.id)}`, {
        method: 'DELETE',
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The planned post could not be removed.')
      setDrafts(previous => previous.filter(draft => draft.id !== selectedDraft.id))
      setSelectedId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The planned post could not be removed.')
    } finally {
      setDeleting(false)
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.assign('/admin/login?next=/plan')
  }

  const planLoaded = !loadingPlan
  const skeletonCount = 12

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <Link href="/admin/home" className={styles.quietLink}>Admin</Link>
          <Link href="/plan" className={styles.wordmark}>Obsidian by Marla</Link>
        </div>

        <p className={styles.headerTitle}>Feed Plan</p>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.quietButton}
            onClick={() => void loadInstagram(true)}
            disabled={refreshingFeed}
          >
            {refreshingFeed ? 'Refreshing' : 'Refresh feed'}
          </button>
          <button type="button" className={styles.quietButton} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.introPanel}>
          <p className={styles.eyebrow}>Instagram planner</p>
          <h1>See the feed before it posts.</h1>
          <p className={styles.introCopy}>
            Add images, drag planned posts into place, then write the caption when the sequence feels right.
          </p>

          <dl className={styles.summary}>
            <div>
              <dt>Planned</dt>
              <dd>{drafts.length}</dd>
            </div>
            <div>
              <dt>Published shown</dt>
              <dd>{feed.length}</dd>
            </div>
          </dl>

          <div className={styles.introActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? uploadStatus || 'Adding posts' : 'Add posts'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={cycleGridOffset}>
              Shift grid {gridOffset}/2
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGES}
            multiple
            className={styles.fileInput}
            onChange={event => void addFiles(event.target.files)}
          />

          <p className={styles.sequenceNote}>
            The planned post nearest the published feed is the next one to share.
          </p>
        </aside>

        <section className={styles.feedPanel} aria-labelledby="feed-heading">
          <div className={styles.feedHeading}>
            <div>
              <h2 id="feed-heading">{instagramUsername ? `@${instagramUsername}` : '@marlizzlle'}</h2>
              <p>{instagramConnected ? 'Planned and published feed' : 'Planned feed preview'}</p>
            </div>
            <span>{drafts.length > 0 ? `${drafts.length} in plan` : 'No drafts yet'}</span>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>Dismiss</button>
            </div>
          )}

          {!loadingFeed && !instagramConnected && (
            <div className={styles.connectionBanner}>
              <div>
                <strong>Instagram feed is not connected</strong>
                <p>{instagramMessage || 'Add the Instagram API credentials to the local environment.'}</p>
              </div>
              <code>INSTAGRAM_ACCESS_TOKEN</code>
            </div>
          )}

          {!planLoaded || loadingFeed ? (
            <div className={styles.feedGrid} aria-label="Loading feed">
              {Array.from({ length: skeletonCount }, (_, index) => (
                <div className={styles.skeleton} key={index} />
              ))}
            </div>
          ) : drafts.length === 0 && feed.length === 0 ? (
            <button
              type="button"
              className={styles.emptyState}
              onClick={() => fileInputRef.current?.click()}
            >
              <span>Start the feed plan</span>
              <small>Add up to 12 images at a time</small>
            </button>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={startDrag}
              onDragCancel={() => setActiveId(null)}
              onDragEnd={finishDrag}
            >
              <SortableContext items={drafts.map(draft => draft.id)} strategy={rectSortingStrategy}>
                <div className={styles.feedGrid}>
                  {Array.from({ length: gridOffset }, (_, index) => (
                    <div className={styles.offsetCell} key={`offset-${index}`} aria-hidden="true" />
                  ))}

                  {drafts.map((draft, index) => (
                    <PlanDraftCard
                      key={draft.id}
                      draft={draft}
                      index={index}
                      selected={draft.id === selectedId}
                      nextToPost={index === drafts.length - 1}
                      reducedMotion={reducedMotion}
                      onSelect={() => setSelectedId(current => current === draft.id ? null : draft.id)}
                    />
                  ))}

                  {feed.map(item => (
                    <a
                      key={item.id}
                      href={item.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className={`${styles.gridCell} ${styles.publishedCell}`}
                      aria-label={`Open Instagram post from ${formatDate(item.timestamp)}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={publishedImage(item)}
                        alt={item.caption || `Instagram post from ${formatDate(item.timestamp)}`}
                        loading="lazy"
                        className={styles.media}
                      />
                      <span className={styles.publishedBadge} aria-hidden="true">
                        <InstagramLogo size={18} weight="regular" />
                      </span>
                    </a>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
                {activeDraft ? (
                  <div className={styles.dragOverlay}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeDraft.mediaUrl} alt="" />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section>

        <aside className={`${styles.editorPanel} ${selectedDraft ? styles.editorPanelOpen : ''}`}>
          {selectedDraft ? (
            <>
              <div className={styles.editorHeading}>
                <div>
                  <p className={styles.eyebrow}>Planned post</p>
                  <h2>Edit details</h2>
                </div>
                <button type="button" onClick={() => setSelectedId(null)}>Close</button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDraft.mediaUrl}
                alt="Selected planned post"
                className={styles.editorImage}
              />

              <div className={styles.captionField}>
                <label htmlFor="plan-caption">Caption</label>
                <textarea
                  id="plan-caption"
                  value={caption}
                  onChange={event => setCaption(event.target.value.slice(0, 2_200))}
                  rows={9}
                  placeholder="Write a caption for this post"
                />
                <span>{caption.length}/2200</span>
              </div>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={saveCaption}
                disabled={savingCaption || caption.trim() === selectedDraft.caption}
              >
                {savingCaption ? 'Saving caption' : 'Save caption'}
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={deleteDraft}
                disabled={deleting}
              >
                {deleting ? 'Removing post' : 'Remove from plan'}
              </button>
            </>
          ) : (
            <div className={styles.editorEmpty}>
              <p className={styles.eyebrow}>Post details</p>
              <p>Select a planned image to add a caption or remove it from the plan.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
