'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { uploadPresigned } from '@vercel/blob/client'
import { InstagramLogo, X } from '@phosphor-icons/react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import PlanDraftCard, { DRAFT_IMAGE_SIZES } from './PlanDraftCard'
import type {
  InstagramFeedResponse,
  InstagramMedia,
  PlanBoardResponse,
  PlanDraft,
} from '@/types/plan'
import styles from './PlanShell.module.css'

const UPLOAD_CONCURRENCY = 3
const FEED_SKELETON_COUNT = 9

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
      const image = new window.Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error(`Could not read ${file.name}`))
      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

interface UploadedImage {
  mediaUrl: string
  width: number
  height: number
  fileName: string
}

async function uploadImage(file: File, pathname: string): Promise<UploadedImage> {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const [blob, dimensions] = await Promise.all([
    uploadPresigned(`${pathname}.${extension}`, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/blob-upload',
      multipart: file.size > 5 * 1024 * 1024,
    }),
    imageDimensions(file),
  ])
  return { mediaUrl: blob.url, ...dimensions, fileName: file.name }
}

function publishedImage(media: InstagramMedia) {
  return media.mediaType === 'VIDEO' && media.thumbnailUrl
    ? media.thumbnailUrl
    : media.mediaUrl
}

// Must match images.remotePatterns in next.config.ts; anything else renders unoptimized
// instead of throwing, in case Instagram serves media from a new host
function canOptimize(url: string) {
  try {
    const { hostname } = new URL(url)
    return hostname.endsWith('.cdninstagram.com') || hostname.endsWith('.fbcdn.net')
  } catch {
    return false
  }
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
  const [addingBlank, setAddingBlank] = useState(false)
  // Photos being uploaded into a square, and the local copy shown there meanwhile
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(() => new Set())
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [previewMedia, setPreviewMedia] = useState<InstagramMedia | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const photoTargetRef = useRef<string | null>(null)
  // On iPhone, releasing a long press can land as a tap on whatever slid under the
  // finger, so ignore select/photo taps right after a drag or right after the panel opens
  const lastDragEndRef = useRef(0)
  const panelOpenedAtRef = useRef(0)
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)

  const sensors = useSensors(
    // Mouse + Touch (not Pointer) so finger drags don't fight page scrolling on iOS
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selectedDraft = useMemo(
    () => drafts.find(draft => draft.id === selectedId) ?? null,
    [drafts, selectedId],
  )
  const selectedUploading = selectedDraft ? uploadingIds.has(selectedDraft.id) : false
  const activeDraft = drafts.find(draft => draft.id === activeId) ?? null

  const closePreview = useCallback(() => {
    setPreviewMedia(null)
    window.requestAnimationFrame(() => previewTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    setCaption(selectedDraft?.caption ?? '')
    panelOpenedAtRef.current = performance.now()
    setConfirmingRemove(false)
  }, [selectedDraft])

  useEffect(() => {
    if (!previewMedia) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closePreview, previewMedia])

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
      const response = await fetch(`/api/plan/instagram${refresh ? '?fresh=1' : ''}`, { cache: 'no-store' })
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

      const items: UploadedImage[] = new Array(normalized.length)

      const batchId = Date.now()
      let nextIndex = 0
      let finished = 0
      setUploadStatus(`Uploading 0 of ${normalized.length}`)
      const uploadNext = async () => {
        while (nextIndex < normalized.length) {
          const index = nextIndex++
          // Keep the original selection order regardless of which upload finishes first
          items[index] = await uploadImage(normalized[index], `images/plan/${batchId}-${index}`)
          setUploadStatus(`Uploading ${++finished} of ${normalized.length}`)
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, normalized.length) }, uploadNext),
      )

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

  const clearLocalPreview = useCallback((draftId: string) => {
    setLocalPreviews(previous => {
      if (!previous[draftId]) return previous
      URL.revokeObjectURL(previous[draftId])
      const next = { ...previous }
      delete next[draftId]
      return next
    })
  }, [])

  function setUploadingFor(draftId: string, uploadingNow: boolean) {
    setUploadingIds(previous => {
      const next = new Set(previous)
      if (uploadingNow) next.add(draftId)
      else next.delete(draftId)
      return next
    })
  }

  function pickPhotoFor(draftId: string) {
    photoTargetRef.current = draftId
    replaceInputRef.current?.click()
  }

  // Fills a blank space with a photo, or swaps the photo on a planned post. The picked
  // file shows in the square right away; the uploaded copy replaces it once it loads.
  async function replaceMedia(incoming: FileList | null) {
    const file = Array.from(incoming ?? []).find(isImageCandidate)
    const draftId = photoTargetRef.current
    if (replaceInputRef.current) replaceInputRef.current.value = ''
    photoTargetRef.current = null
    if (!file || !draftId || uploadingIds.has(draftId)) return

    setError('')
    setUploadingFor(draftId, true)
    setLocalPreviews(previous => {
      if (previous[draftId]) URL.revokeObjectURL(previous[draftId])
      return { ...previous, [draftId]: URL.createObjectURL(file) }
    })
    try {
      const image = await uploadImage(await normalizeImage(file), `images/plan/${Date.now()}-${draftId}`)
      const response = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'media', id: draftId, ...image }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { draft?: PlanDraft; error?: string }
      if (!response.ok || !data.draft) throw new Error(data.error ?? 'The photo could not be added.')
      setDrafts(previous => previous.map(draft => draft.id === draftId ? data.draft! : draft))
    } catch (replaceError) {
      clearLocalPreview(draftId)
      setError(replaceError instanceof Error ? replaceError.message : 'The photo could not be added.')
    } finally {
      setUploadingFor(draftId, false)
    }
  }

  function choosePhoto() {
    if (!selectedDraft || performance.now() - panelOpenedAtRef.current < 500) return
    pickPhotoFor(selectedDraft.id)
  }

  async function addPlaceholder() {
    if (addingBlank) return
    setError('')
    setAddingBlank(true)
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeholder: true }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { drafts?: PlanDraft[]; error?: string }
      if (!response.ok || !data.drafts) throw new Error(data.error ?? 'The blank space could not be added.')
      setDrafts(previous => [...data.drafts!, ...previous])
    } catch (blankError) {
      setError(blankError instanceof Error ? blankError.message : 'The blank space could not be added.')
    } finally {
      setAddingBlank(false)
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
    lastDragEndRef.current = performance.now()
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

  async function removeDraft(draftId: string) {
    setError('')
    try {
      const response = await fetch(`/api/plan?id=${encodeURIComponent(draftId)}`, {
        method: 'DELETE',
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'The planned post could not be removed.')
      setDrafts(previous => previous.filter(draft => draft.id !== draftId))
      setSelectedId(current => current === draftId ? null : current)
      clearLocalPreview(draftId)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The planned post could not be removed.')
    }
  }

  // The panel's x: a post loses its photo but keeps its spot as a blank;
  // a blank (no photo left to take out) is removed from the plan
  async function removeSelected() {
    if (!selectedDraft || deleting) return
    const draftId = selectedDraft.id
    setDeleting(true)
    try {
      if (selectedDraft.placeholder) {
        await removeDraft(draftId)
        return
      }

      setError('')
      const response = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearMedia', id: draftId }),
      })
      if (handleUnauthorized(response)) return
      const data = await response.json() as { draft?: PlanDraft; error?: string }
      if (!response.ok || !data.draft) throw new Error(data.error ?? 'The photo could not be removed.')
      setDrafts(previous => previous.map(draft => draft.id === draftId ? data.draft! : draft))
      clearLocalPreview(draftId)
      setConfirmingRemove(false)
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'The photo could not be removed.')
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
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void addPlaceholder()}
              disabled={addingBlank}
            >
              Add blank space
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
          <input
            ref={replaceInputRef}
            type="file"
            accept={ACCEPTED_IMAGES}
            className={styles.fileInput}
            onChange={event => void replaceMedia(event.target.files)}
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
            <dl className={styles.feedStats}>
              <div>
                <dd>{drafts.length}</dd>
                <dt>Planned</dt>
              </div>
              <div>
                <dd>{feed.length}</dd>
                <dt>Posted</dt>
              </div>
            </dl>
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

          {!planLoaded ? (
            <div className={styles.feedGrid} aria-label="Loading feed">
              {Array.from({ length: skeletonCount }, (_, index) => (
                <div className={styles.skeleton} key={index} />
              ))}
            </div>
          ) : drafts.length === 0 && feed.length === 0 && !loadingFeed ? (
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
              onDragCancel={() => {
                lastDragEndRef.current = performance.now()
                setActiveId(null)
              }}
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
                      reducedMotion={reducedMotion}
                      localPreview={localPreviews[draft.id]}
                      uploading={uploadingIds.has(draft.id)}
                      onSelect={() => {
                        if (performance.now() - lastDragEndRef.current < 400) return
                        // Blank squares go straight to the photo picker, with the panel opening
                        // behind it so a picked photo (or a cancel) lands on caption and remove
                        if (draft.placeholder) {
                          setSelectedId(draft.id)
                          pickPhotoFor(draft.id)
                          return
                        }
                        setSelectedId(current => current === draft.id ? null : draft.id)
                      }}
                      onPreviewSettled={() => clearLocalPreview(draft.id)}
                    />
                  ))}

                  {loadingFeed && Array.from({ length: FEED_SKELETON_COUNT }, (_, index) => (
                    <div className={styles.skeleton} key={`feed-skeleton-${index}`} />
                  ))}

                  {feed.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.gridCell} ${styles.publishedCell}`}
                      aria-label={`View Instagram post from ${formatDate(item.timestamp)} fullscreen`}
                      onClick={event => {
                        previewTriggerRef.current = event.currentTarget
                        setPreviewMedia(item)
                      }}
                    >
                      <Image
                        src={publishedImage(item)}
                        alt={item.caption || `Instagram post from ${formatDate(item.timestamp)}`}
                        fill
                        sizes={DRAFT_IMAGE_SIZES}
                        unoptimized={!canOptimize(publishedImage(item))}
                        className={styles.media}
                      />
                      <span className={styles.publishedBadge} aria-hidden="true">
                        <InstagramLogo size={18} weight="regular" />
                      </span>
                    </button>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
                {activeDraft ? (
                  <div className={styles.dragOverlay}>
                    {activeDraft.placeholder ? (
                      <span className={styles.placeholderFill} />
                    ) : (
                      <Image
                        src={activeDraft.mediaUrl}
                        alt=""
                        width={activeDraft.width}
                        height={activeDraft.height}
                        sizes={DRAFT_IMAGE_SIZES}
                      />
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section>

        {selectedDraft && (
          <button
            type="button"
            className={styles.sheetBackdrop}
            aria-label="Close post details"
            onClick={() => setSelectedId(null)}
          />
        )}

        <aside className={`${styles.editorPanel} ${selectedDraft ? styles.editorPanelOpen : ''}`}>
          {selectedDraft ? (
            <>
              <div className={styles.editorHeading}>
                <div>
                  <p className={styles.eyebrow}>{selectedDraft.placeholder ? 'Blank space' : 'Planned post'}</p>
                  <h2>Edit details</h2>
                </div>
                <button type="button" onClick={() => setSelectedId(null)}>Close</button>
              </div>

              <div className={styles.editorMedia}>
                {localPreviews[selectedDraft.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={localPreviews[selectedDraft.id]} alt="" className={styles.editorImage} />
                ) : selectedDraft.placeholder ? (
                  <button
                    type="button"
                    className={`${styles.editorImage} ${styles.addPhotoTile}`}
                    onClick={choosePhoto}
                    disabled={selectedUploading}
                  >
                    <span>Tap to add a photo</span>
                  </button>
                ) : (
                  <Image
                    key={selectedDraft.id}
                    src={selectedDraft.mediaUrl}
                    alt="Selected planned post"
                    width={selectedDraft.width}
                    height={selectedDraft.height}
                    sizes="(max-width: 1180px) 88vw, 22rem"
                    className={styles.editorImage}
                  />
                )}

                {selectedUploading && <span className={styles.uploadingVeil} aria-label="Uploading photo" />}

                {confirmingRemove ? (
                  <div
                    className={styles.removeConfirm}
                    role="alertdialog"
                    aria-label={selectedDraft.placeholder ? 'Remove blank space?' : 'Remove photo?'}
                  >
                    <p>{selectedDraft.placeholder ? 'Remove blank space?' : 'Remove photo?'}</p>
                    {!selectedDraft.placeholder && <small>The spot stays as a blank</small>}
                    <button type="button" className={styles.removeConfirmYes} onClick={() => void removeSelected()} disabled={deleting}>
                      {deleting ? 'Removing' : 'Remove'}
                    </button>
                    <button type="button" onClick={() => setConfirmingRemove(false)} disabled={deleting}>
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.removeChip}
                    aria-label={selectedDraft.placeholder ? 'Remove this blank space' : 'Remove this photo'}
                    onClick={() => setConfirmingRemove(true)}
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>

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
                className={styles.secondaryButton}
                onClick={choosePhoto}
                disabled={selectedUploading}
              >
                {selectedUploading
                  ? 'Uploading photo'
                  : selectedDraft.placeholder ? 'Add photo' : 'Replace photo'}
              </button>

              <button
                type="button"
                className={`${styles.primaryButton} ${styles.saveCaptionButton}`}
                onClick={saveCaption}
                disabled={savingCaption || caption.trim() === selectedDraft.caption}
              >
                {savingCaption ? 'Saving caption' : 'Save caption'}
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

      <nav className={styles.mobileBar} aria-label="Planner actions">
        {uploading && <p className={styles.mobileStatus}>{uploadStatus || 'Adding posts'}</p>}
        <button
          type="button"
          className={styles.mobileBarPrimary}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Adding' : 'Add posts'}
        </button>
        <button type="button" onClick={() => void addPlaceholder()} disabled={addingBlank}>
          Blank
        </button>
        <button type="button" onClick={cycleGridOffset}>
          Shift {gridOffset}/2
        </button>
        <button type="button" onClick={() => void loadInstagram(true)} disabled={refreshingFeed}>
          {refreshingFeed ? 'Loading' : 'Refresh'}
        </button>
      </nav>

      {previewMedia && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Instagram post from ${formatDate(previewMedia.timestamp)}`}
          onMouseDown={event => {
            if (event.target === event.currentTarget) closePreview()
          }}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            aria-label="Close fullscreen image"
            onClick={closePreview}
            autoFocus
          >
            <X size={24} weight="regular" />
          </button>

          <div className={styles.lightboxMedia}>
            {previewMedia.mediaType === 'VIDEO' ? (
              <video
                src={previewMedia.mediaUrl}
                poster={previewMedia.thumbnailUrl ?? undefined}
                controls
                playsInline
                preload="metadata"
                className={styles.lightboxAsset}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewMedia.mediaUrl}
                alt={previewMedia.caption || `Instagram post from ${formatDate(previewMedia.timestamp)}`}
                className={styles.lightboxAsset}
                decoding="async"
              />
            )}
          </div>

          <div className={styles.lightboxMeta}>
            <span>{instagramUsername ? `@${instagramUsername}` : '@marlizzlle'}</span>
            <span>{formatDate(previewMedia.timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
