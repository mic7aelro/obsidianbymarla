'use client'

import { useState, useEffect, useRef } from 'react'
import CreateCollectionModal from './CreateCollectionModal'

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

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
}

export default function CurateShell({ galleries }: { galleries: Gallery[] }) {
  const [galleryIndex, setGalleryIndex] = useState(0)
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
  const [dragged, setDragged] = useState<string | null>(null)
  const [covers, setCovers] = useState<Record<string, string>>(() =>
    Object.fromEntries(galleries.map(gallery => [gallery.slug, gallery.coverImage]))
  )
  const [orders, setOrders] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(galleries.map(gallery => [gallery.slug, gallery.images.map(image => image.src)]))
  )

  const gallery = galleries[galleryIndex]
  const imageLookup = new Map(gallery?.images.map(image => [image.src, image]) ?? [])
  const allImages = (orders[gallery?.slug] ?? []).map(src => imageLookup.get(src)).filter((image): image is CurateImage => Boolean(image))
  const coverImage = covers[gallery?.slug]
  const kept = allImages.filter(i => !hidden.has(i.src)).length

  useEffect(() => { setSelected(new Set()) }, [galleryIndex])

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

  async function saveCuration(slug: string, updates: { imageOrder?: string[]; coverImage?: string }) {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/curate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...updates }),
      })
      if (!response.ok) throw new Error('Could not save gallery changes')
    } finally {
      setSaving(false)
    }
  }

  function moveImage(target: string) {
    if (!gallery || !dragged || dragged === target) return
    const current = orders[gallery.slug]
    const from = current.indexOf(dragged)
    const to = current.indexOf(target)
    if (from < 0 || to < 0) return
    const next = [...current]
    next.splice(from, 1)
    next.splice(to, 0, dragged)
    setOrders(previous => ({ ...previous, [gallery.slug]: next }))
    setDragged(null)
    void saveCuration(gallery.slug, { imageOrder: next })
  }

  function setThumbnail(src: string) {
    if (!gallery || coverImage === src) return
    setCovers(previous => ({ ...previous, [gallery.slug]: src }))
    void saveCuration(gallery.slug, { coverImage: src })
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000' }}>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 2rem', borderBottom: '1px solid #1a1a1a',
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="/admin" style={{ ...labelStyle, opacity: 0.3, color: '#fff', textDecoration: 'none' }}>← Admin</a>
          <span style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '1rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>
            Curate
          </span>
        </div>

        {/* Collections dropdown — absolutely centered */}
        <div ref={collectionsRef} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
              background: '#0d0d0d', border: '1px solid #222',
              width: 'max-content', zIndex: 100,
            }}>
              {galleries.map((g, i) => {
                const isActive = i === galleryIndex
                const isDisabled = disabled.has(g.slug)
                return (
                  <div key={g.slug} style={{
                    padding: '10px 16px', borderBottom: '1px solid #1a1a1a',
                    background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                  }}>
                    <button
                      onClick={() => { setGalleryIndex(i); setSelected(new Set()); setCollectionsOpen(false) }}
                      style={{ ...labelStyle, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: isActive ? 1 : isDisabled ? 0.2 : 0.4, textAlign: 'left', padding: 0 }}
                    >
                      {g.title}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleCollectionDisabled(g.slug) }}
                      style={{
                        ...labelStyle, fontSize: '8px',
                        background: 'transparent',
                        border: `1px solid ${isDisabled ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: isDisabled ? 'rgba(255,100,100,0.8)' : 'rgba(255,255,255,0.3)',
                        padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {isDisabled ? 'Hidden from /work' : 'Visible'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
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
        </div>
      </div>

      {createOpen && (
        <CreateCollectionModal
          onClose={() => setCreateOpen(false)}
          onCreated={(slug, title) => {
            setCreateOpen(false)
            // Reload the page so the new collection appears in the curate list
            window.location.reload()
          }}
        />
      )}

      {/* Ordered image grid */}
      <div style={{ padding: '3px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '3px' }}>
        {allImages.map((img, i) => {
          const isSelected = selected.has(img.src)
          const isHidden = hidden.has(img.src)
          return (
            <div
              key={img.src}
              onClick={() => toggleSelect(img.src)}
              draggable
              onDragStart={event => {
                setDragged(img.src)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', img.src)
              }}
              onDragEnd={() => setDragged(null)}
              onDragOver={event => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={event => {
                event.preventDefault()
                event.stopPropagation()
                moveImage(img.src)
              }}
              style={{
                position: 'relative',
                aspectRatio: '4 / 5',
                overflow: 'hidden',
                cursor: dragged ? 'grabbing' : 'grab',
                outline: isSelected ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
                outlineOffset: '-3px',
                transition: 'outline-color 0.1s',
                background: '#111',
              }}
              className="curate-cell"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                width={img.width}
                height={img.height}
                loading="lazy"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: isHidden ? 0.2 : 1,
                  transition: 'opacity 0.2s',
                }}
              />

              {/* Index badge */}
              <div style={{ position: 'absolute', top: '8px', left: '10px', ...labelStyle, fontSize: '8px', opacity: 0.45, color: '#fff' }}>
                {i + 1}
              </div>

              <div style={{ position: 'absolute', top: '8px', right: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {coverImage === img.src && (
                  <span style={{ ...labelStyle, fontSize: '8px', color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '4px 6px' }}>Thumbnail</span>
                )}
                {isHidden && (
                  <span style={{ ...labelStyle, fontSize: '8px', color: 'rgba(255,100,100,0.9)', background: 'rgba(0,0,0,0.65)', padding: '4px 6px' }}>Hidden</span>
                )}
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div style={{
                  position: 'absolute', bottom: '10px', right: '10px',
                  width: '20px', height: '20px', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: '#000',
                }}>
                  ✓
                </div>
              )}

              {/* Per-image toggle */}
              <button
                onClick={e => { e.stopPropagation(); toggleSingleImage(img.src) }}
                style={{
                  position: 'absolute', bottom: '10px', left: '10px',
                  ...labelStyle, fontSize: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: isHidden ? 'rgba(100,220,120,0.9)' : 'rgba(255,100,100,0.8)',
                  padding: '3px 7px', cursor: 'pointer',
                  opacity: 0, transition: 'opacity 0.15s',
                }}
                className="img-toggle"
              >
                {isHidden ? 'Unhide' : 'Hide'}
              </button>

              <button
                onClick={event => { event.stopPropagation(); setThumbnail(img.src) }}
                disabled={coverImage === img.src}
                style={{
                  position: 'absolute', bottom: '10px', left: '74px',
                  ...labelStyle, fontSize: '8px',
                  background: coverImage === img.src ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: coverImage === img.src ? '#000' : '#fff',
                  padding: '3px 7px', cursor: coverImage === img.src ? 'default' : 'pointer',
                  opacity: coverImage === img.src ? 1 : 0, transition: 'opacity 0.15s',
                }}
                className="thumbnail-toggle"
              >
                {coverImage === img.src ? 'Current thumbnail' : 'Set thumbnail'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      <div style={{ padding: '2rem', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <p style={{ ...labelStyle, color: 'rgba(100,220,120,0.7)' }}>{totalKept} of {totalAll} kept across all galleries</p>
        <p style={{ ...labelStyle, opacity: 0.2, color: '#fff' }}>Drag to reorder · set thumbnail independently · H hide · U unhide</p>
      </div>

      <style>{`
        .curate-cell:hover .img-toggle,
        .curate-cell:hover .thumbnail-toggle { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
