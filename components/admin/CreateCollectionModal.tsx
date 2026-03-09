'use client'

import { useState, useRef, useCallback } from 'react'

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '9px',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
}

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  padding: '10px 14px',
  width: '100%',
  fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}

interface Props {
  onClose: () => void
  onCreated: (slug: string, title: string) => void
}

export default function CreateCollectionModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(f => f.type.startsWith('image/'))
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...arr.filter(f => !existing.has(f.name))]
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const items = e.dataTransfer.items
    if (items) {
      const imageFiles: File[] = []
      const promises: Promise<void>[] = []
      for (const item of Array.from(items)) {
        const entry = item.webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader()
          promises.push(new Promise(res => {
            reader.readEntries(entries => {
              for (const e of entries) {
                if (e.isFile) {
                  (e as FileSystemFileEntry).file(f => {
                    if (f.type.startsWith('image/')) imageFiles.push(f)
                  })
                }
              }
              res()
            })
          }))
        } else if (entry?.isFile) {
          promises.push(new Promise(res => {
            (entry as FileSystemFileEntry).file(f => {
              if (f.type.startsWith('image/')) imageFiles.push(f)
              res()
            })
          }))
        }
      }
      Promise.all(promises).then(() => addFiles(imageFiles))
    } else {
      addFiles(e.dataTransfer.files)
    }
  }, [])

  async function submit() {
    if (!title.trim() || !category.trim() || files.length === 0) {
      setError('Title, category, and at least one image are required.')
      return
    }
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('title', title.trim())
    fd.append('category', category.trim())
    fd.append('year', year)
    for (const f of files) fd.append('images', f)

    const res = await fetch('/api/admin/collections', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setError(data.error ?? 'Upload failed'); return }
    onCreated(data.slug, title.trim())
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#0a0a0a', border: '1px solid #222',
        width: '560px', maxWidth: '95vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '1rem', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff' }}>
            New Collection
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ ...labelStyle, opacity: 0.4, color: '#fff' }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="NYFW 23"
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Category / Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ ...labelStyle, opacity: 0.4, color: '#fff' }}>Category</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Runway 2023"
              style={inputStyle}
            />
          </div>

          {/* Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ ...labelStyle, opacity: 0.4, color: '#fff' }}>Year</label>
            <input
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="2023"
              style={{ ...inputStyle, width: '120px' }}
              type="number"
            />
          </div>

          {/* Drop zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ ...labelStyle, opacity: 0.4, color: '#fff' }}>Images</label>
            <div
              ref={dropRef}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'rgba(255,255,255,0.03)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {files.length === 0 ? (
                <>
                  <p style={{ ...labelStyle, opacity: 0.35, color: '#fff', marginBottom: '6px' }}>Drop a folder or images here</p>
                  <p style={{ ...labelStyle, fontSize: '8px', opacity: 0.2, color: '#fff' }}>or click to browse</p>
                </>
              ) : (
                <>
                  <p style={{ ...labelStyle, color: 'rgba(100,220,120,0.8)', marginBottom: '4px' }}>{files.length} image{files.length !== 1 ? 's' : ''} ready</p>
                  <p style={{ ...labelStyle, fontSize: '8px', opacity: 0.2, color: '#fff' }}>click to add more</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* Preview strip */}
          {files.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {files.slice(0, 12).map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  style={{ width: '64px', height: '64px', objectFit: 'cover', flexShrink: 0, opacity: 0.8 }}
                />
              ))}
              {files.length > 12 && (
                <div style={{ width: '64px', height: '64px', background: '#111', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...labelStyle, fontSize: '8px', opacity: 0.4, color: '#fff' }}>
                  +{files.length - 12}
                </div>
              )}
            </div>
          )}

          {error && <p style={{ ...labelStyle, color: 'rgba(255,100,100,0.9)', fontSize: '8px' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 2rem', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ ...labelStyle, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '9px 18px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={submit} disabled={uploading} style={{ ...labelStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '9px 20px', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
            {uploading ? `Uploading ${files.length} images…` : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}
