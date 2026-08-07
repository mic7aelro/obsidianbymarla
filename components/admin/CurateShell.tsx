'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { DotsSixVertical } from '@phosphor-icons/react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import CreateCollectionModal from './CreateCollectionModal'
import SortableImageCard from './SortableImageCard'
import BlobUsageMeter from './BlobUsageMeter'
import styles from './CurateShell.module.css'

interface CurateImage {
  src: string
  width: number
  height: number
  hidden: boolean
}

interface Gallery {
  slug: string
  title: string
  disabled: boolean
  coverImage: string
  images: CurateImage[]
}

interface SortableCollectionRowProps {
  gallery: Gallery
  active: boolean
  disabled: boolean
  onSelect: () => void
  onToggleDisabled: () => void
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
}

function SortableCollectionRow({
  gallery,
  active,
  disabled,
  onSelect,
  onToggleDisabled,
}: SortableCollectionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gallery.slug })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.collectionRow} ${active ? styles.collectionRowActive : ''} ${isDragging ? styles.collectionRowDragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.collectionMove}
        aria-label={`Move ${gallery.title}. Press and hold, then drag to reorder.`}
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical size={15} weight="bold" aria-hidden="true" />
      </button>
      <button type="button" onClick={onSelect} className={styles.collectionTitle}>
        {gallery.title}
      </button>
      <button
        type="button"
        onClick={event => { event.stopPropagation(); onToggleDisabled() }}
        className={`${styles.collectionVisibility} ${disabled ? styles.collectionVisibilityHidden : ''}`}
      >
        {disabled ? 'Hidden from /work' : 'Visible'}
      </button>
    </div>
  )
}

export default function CurateShell({ galleries }: { galleries: Gallery[] }) {
  const [activeGallerySlug, setActiveGallerySlug] = useState(galleries[0]?.slug ?? '')
  const [galleryOrder, setGalleryOrder] = useState(() => galleries.map(gallery => gallery.slug))
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const collectionsRef = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState<Set<string>>(() =>
    new Set(galleries.filter(g => g.disabled).map(g => g.slug))
  )
  const [hidden, setHidden] = useState<Set<string>>(() => {
    const set = new Set<string>()
    galleries.forEach(g => g.images.forEach(img => { if (img.hidden) set.add(img.src) }))
    return set
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [covers, setCovers] = useState<Record<string, string>>(() =>
    Object.fromEntries(galleries.map(gallery => [gallery.slug, gallery.coverImage]))
  )
  const [orders, setOrders] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(galleries.map(gallery => [gallery.slug, gallery.images.map(image => image.src)]))
  )

  const orderedGalleries = useMemo(() => {
    const bySlug = new Map(galleries.map(item => [item.slug, item]))
    const ordered = galleryOrder.map(slug => bySlug.get(slug)).filter((item): item is Gallery => Boolean(item))
    const included = new Set(ordered.map(item => item.slug))
    return [...ordered, ...galleries.filter(item => !included.has(item.slug))]
  }, [galleries, galleryOrder])
  const gallery = orderedGalleries.find(item => item.slug === activeGallerySlug) ?? orderedGalleries[0]
  const imageLookup = new Map(gallery?.images.map(image => [image.src, image]) ?? [])
  const allImages = (orders[gallery?.slug] ?? []).map(src => imageLookup.get(src)).filter((image): image is CurateImage => Boolean(image))
  const coverImage = covers[gallery?.slug]
  const kept = allImages.filter(i => !hidden.has(i.src)).length
  const activeImage = activeId ? imageLookup.get(activeId) : undefined
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { setSelected(new Set()) }, [gallery?.slug])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  const toggleSelect = (src: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(src)) next.delete(src)
      else next.add(src)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(allImages.map(i => i.src)))
  const selectNone = () => setSelected(new Set())

  async function saveToggle(src: string, isHidden: boolean) {
    await fetch('/api/admin/curate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src, hidden: isHidden }),
    })
  }

  async function toggleHideSelected() {
    if (saving || selected.size === 0) return
    setSaving(true)
    const newHidden = new Set(hidden)
    const srcs = Array.from(selected)
    for (const src of srcs) {
      if (newHidden.has(src)) newHidden.delete(src)
      else newHidden.add(src)
    }
    setHidden(newHidden)
    await Promise.all(srcs.map(src => saveToggle(src, newHidden.has(src))))
    setSaving(false)
    setSelected(new Set())
  }

  async function hideSelected() {
    if (saving || selected.size === 0) return
    setSaving(true)
    const newHidden = new Set(hidden)
    const srcs = Array.from(selected)
    for (const src of srcs) newHidden.add(src)
    setHidden(newHidden)
    await Promise.all(srcs.map(src => saveToggle(src, true)))
    setSaving(false)
    setSelected(new Set())
  }

  async function unhideSelected() {
    if (saving || selected.size === 0) return
    setSaving(true)
    const newHidden = new Set(hidden)
    const srcs = Array.from(selected)
    for (const src of srcs) newHidden.delete(src)
    setHidden(newHidden)
    await Promise.all(srcs.map(src => saveToggle(src, false)))
    setSaving(false)
    setSelected(new Set())
  }

  async function toggleCollectionDisabled(slug: string) {
    const next = new Set(disabled)
    const isNowDisabled = !next.has(slug)
    if (isNowDisabled) next.add(slug)
    else next.delete(slug)
    setDisabled(next)
    await fetch('/api/admin/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, disabled: isNowDisabled }),
    })
  }

  async function saveGalleryOrder(order: string[]) {
    const response = await fetch('/api/admin/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    })
    if (!response.ok) throw new Error('Could not save gallery order')
  }

  function finishGalleryMove(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return
    const current = orderedGalleries.map(item => item.slug)
    const from = current.indexOf(String(event.active.id))
    const to = current.indexOf(String(event.over.id))
    if (from < 0 || to < 0) return
    const next = arrayMove(current, from, to)
    setGalleryOrder(next)
    setSaving(true)
    setSaveError('')
    void saveGalleryOrder(next)
      .catch(error => {
        setGalleryOrder(current)
        setSaveError(error instanceof Error ? error.message : 'Could not save gallery order')
      })
      .finally(() => setSaving(false))
  }

  async function saveCuration(slug: string, updates: { imageOrder?: string[]; coverImage?: string }) {
    setSaving(true)
    setSaveError('')
    try {
      const response = await fetch('/api/admin/curate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...updates }),
      })
      if (!response.ok) throw new Error('Could not save gallery changes')
      return true
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save gallery changes')
      return false
    } finally {
      setSaving(false)
    }
  }

  function finishImageMove(event: DragEndEvent) {
    setActiveId(null)
    if (!gallery || !event.over || event.active.id === event.over.id) return
    const current = orders[gallery.slug]
    const from = current.indexOf(String(event.active.id))
    const to = current.indexOf(String(event.over.id))
    if (from < 0 || to < 0) return
    const next = arrayMove(current, from, to)
    setOrders(previous => ({ ...previous, [gallery.slug]: next }))
    void saveCuration(gallery.slug, { imageOrder: next }).then(saved => {
      if (!saved) setOrders(previous => ({ ...previous, [gallery.slug]: current }))
    })
  }

  function setThumbnail(src: string) {
    if (!gallery || coverImage === src) return
    const previousCover = coverImage
    setCovers(previous => ({ ...previous, [gallery.slug]: src }))
    void saveCuration(gallery.slug, { coverImage: src }).then(saved => {
      if (!saved) setCovers(previous => ({ ...previous, [gallery.slug]: previousCover }))
    })
  }

  async function toggleSingleImage(src: string) {
    const newHidden = new Set(hidden)
    if (newHidden.has(src)) newHidden.delete(src)
    else newHidden.add(src)
    setHidden(newHidden)
    await saveToggle(src, newHidden.has(src))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'a') selectAll()
      if (e.key === 'd') selectNone()
      if (e.key === 'h') hideSelected()
      if (e.key === 'u') unhideSelected()
      if (e.key === 'Escape') setCollectionsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allImages, selected, hidden])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false)
      }
    }
    if (collectionsOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [collectionsOpen])

  const totalKept = galleries.reduce((acc, g) => acc + g.images.filter(i => !hidden.has(i.src)).length, 0)
  const totalAll = galleries.reduce((acc, g) => acc + g.images.length, 0)

  return (
    <div className={styles.shell}>

      {/* Sticky Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <a href="/admin" style={{ ...labelStyle, opacity: 0.3, color: '#fff', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '1rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>
            Curate
          </span>
        </div>

        {/* Collections dropdown, centered in the toolbar */}
        <div ref={collectionsRef} className={styles.collections}>
          <button
            onClick={() => setCreateOpen(true)}
            style={{ ...labelStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '7px 11px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
            title="New Collection"
          >
            +
          </button>
          <button
            onClick={() => setCollectionsOpen(o => !o)}
            style={{ ...labelStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '7px 16px', cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Collections <span style={{ fontSize: '6px', opacity: 0.5 }}>{collectionsOpen ? '▲' : '▼'}</span>
          </button>

          {collectionsOpen && (
            <div className={styles.collectionsMenu}>
              <p className={styles.collectionsHint}>Hold the grip and drag to set the order on /work</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finishGalleryMove}>
                <SortableContext items={orderedGalleries.map(item => item.slug)} strategy={verticalListSortingStrategy}>
                  <div className={styles.collectionList}>
                    {orderedGalleries.map(item => (
                      <SortableCollectionRow
                        key={item.slug}
                        gallery={item}
                        active={item.slug === gallery?.slug}
                        disabled={disabled.has(item.slug)}
                        onSelect={() => {
                          setActiveGallerySlug(item.slug)
                          setSelected(new Set())
                          setCollectionsOpen(false)
                        }}
                        onToggleDisabled={() => void toggleCollectionDisabled(item.slug)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <span style={{ ...labelStyle, opacity: 0.3, color: '#fff', marginRight: '0.5rem' }}>
            {selected.size > 0 ? `${selected.size} selected` : `${kept}/${allImages.length} kept`}
          </span>
          <button onClick={hideSelected} disabled={selected.size === 0 || saving}
            style={{ ...labelStyle, background: 'transparent', border: '1px solid rgba(255,80,80,0.4)', color: 'rgba(255,100,100,0.85)', padding: '7px 14px', cursor: selected.size === 0 ? 'default' : 'pointer', opacity: selected.size === 0 ? 0.4 : 1 }}>
            Hide (H)
          </button>
          <button onClick={unhideSelected} disabled={selected.size === 0 || saving}
            style={{ ...labelStyle, background: 'rgba(100,220,120,0.07)', border: '1px solid rgba(100,220,120,0.4)', color: 'rgba(100,220,120,0.9)', padding: '7px 14px', cursor: selected.size === 0 ? 'default' : 'pointer', opacity: selected.size === 0 ? 0.4 : 1 }}>
            Unhide (U)
          </button>
          {saving && <span style={{ ...labelStyle, opacity: 0.25, color: '#fff' }}>Saving…</span>}
          {saveError && <span style={{ ...labelStyle, color: 'rgba(255,120,120,0.9)' }}>{saveError}</span>}
        </div>
      </div>

      {createOpen && (
        <CreateCollectionModal
          onClose={() => setCreateOpen(false)}
          onCreated={(slug, title) => {
            setCreateOpen(false)
            // Reload so the new collection appears immediately in the curated list.
            window.location.reload()
          }}
        />
      )}

      <div className={styles.overview}>
        <div>
          <p style={{ ...labelStyle, color: 'rgba(255,255,255,0.66)', marginBottom: '0.6rem' }}>{gallery?.title ?? 'Collection'}</p>
          <p style={{ ...labelStyle, opacity: 0.26, color: '#fff', lineHeight: 1.8 }}>Press and hold a numbered handle to reorder · release to save</p>
        </div>
        <BlobUsageMeter />
      </div>

      {/* Ordered image grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={event => setActiveId(String(event.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={finishImageMove}
      >
        <SortableContext items={allImages.map(image => image.src)} strategy={rectSortingStrategy}>
          <div className={styles.grid}>
            {allImages.map((image, index) => (
              <SortableImageCard
                key={image.src}
                image={image}
                index={index}
                isSelected={selected.has(image.src)}
                isHidden={hidden.has(image.src)}
                isThumbnail={coverImage === image.src}
                reducedMotion={reducedMotion}
                onSelect={() => toggleSelect(image.src)}
                onToggleHidden={() => void toggleSingleImage(image.src)}
                onSetThumbnail={() => setThumbnail(image.src)}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay
          adjustScale
          dropAnimation={reducedMotion ? null : {
            duration: 420,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {activeImage ? (
            <div className={styles.dragOverlay}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImage.src} alt="" width={activeImage.width} height={activeImage.height} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Footer summary */}
      <div className={styles.footer}>
        <div className={styles.summary}>
          <p style={{ ...labelStyle, color: 'rgba(255,255,255,0.72)' }}>{totalKept} of {totalAll} kept across all galleries</p>
          <p style={{ ...labelStyle, opacity: 0.28, color: '#fff' }}>Press and hold a numbered handle to reorder · set thumbnails independently</p>
        </div>
      </div>
    </div>
  )
}
