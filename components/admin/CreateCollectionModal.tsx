'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadPresigned } from '@vercel/blob/client'

const acceptedImageTypes = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif'

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
  const [thumbnailName, setThumbnailName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [conversionStatus, setConversionStatus] = useState('')
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    const candidates = Array.from(incoming).filter(isImageCandidate)
    if (candidates.length === 0) return

    setError('')
    setConverting(true)
    try {
      const normalized: File[] = []
      for (let index = 0; index < candidates.length; index++) {
        const file = candidates[index]
        if (/\.(heic|heif)$/i.test(file.name) || /image\/(heic|heif)/i.test(file.type)) {
          setConversionStatus(`Converting ${index + 1} of ${candidates.length}`)
        }
        normalized.push(await normalizeImage(file))
      }

      setFiles(previous => {
        const existing = new Set(previous.map(file => file.name.toLowerCase()))
        const next = [
          ...previous,
          ...normalized.filter(file => !existing.has(file.name.toLowerCase())),
        ]
        setThumbnailName(current => current || next[0]?.name || '')
        return next
      })
    } catch (conversionError) {
      setError(conversionError instanceof Error
        ? `Could not convert this HEIC image: ${conversionError.message}`
        : 'Could not convert this HEIC image.')
    } finally {
      setConverting(false)
      setConversionStatus('')
    }
  }, [])

  function slugify(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function getDimensions(file: File): Promise<{ width: number; height: number }> {
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
                    if (isImageCandidate(f)) imageFiles.push(f)
                  })
                }
              }
              res()
            })
          }))
        } else if (entry?.isFile) {
          promises.push(new Promise(res => {
            (entry as FileSystemFileEntry).file(f => {
              if (isImageCandidate(f)) imageFiles.push(f)
              res()
            })
          }))
        }
      }
      Promise.all(promises).then(() => void addFiles(imageFiles))
    } else {
      void addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  async function submit() {
    if (!title.trim() || !category.trim() || files.length === 0) {
      setError('Title, category, and at least one image are required.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const slug = slugify(title.trim())
      const uploaded: Array<{ src: string; width: number; height: number; fileName: string }> = []

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        setUploadStatus(`Uploading ${index + 1} of ${files.length}`)
        const [blob, dimensions] = await Promise.all([
          uploadPresigned(`images/projects/${slug}/${index + 1}.${extension}`, file, {
            access: 'public',
            handleUploadUrl: '/api/admin/blob-upload',
            multipart: file.size > 5 * 1024 * 1024,
          }),
          getDimensions(file),
        ])
        uploaded.push({ src: blob.url, ...dimensions, fileName: file.name })
      }

      const coverImage = uploaded.find(image => image.fileName === thumbnailName)?.src ?? uploaded[0].src
      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          year,
          coverImage,
          images: uploaded.map(({ fileName, ...image }) => image),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Upload failed')
      onCreated(data.slug, title.trim())
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadStatus('')
    }
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
              {converting ? (
                <>
                  <p style={{ ...labelStyle, color: 'rgba(255,255,255,0.82)', marginBottom: '6px' }}>{conversionStatus || 'Preparing images'}</p>
                  <p style={{ ...labelStyle, fontSize: '8px', opacity: 0.28, color: '#fff' }}>HEIC is converted to a high-quality JPEG on this device</p>
                </>
              ) : files.length === 0 ? (
                <>
                  <p style={{ ...labelStyle, opacity: 0.35, color: '#fff', marginBottom: '6px' }}>Drop a folder or images here</p>
                  <p style={{ ...labelStyle, fontSize: '8px', opacity: 0.2, color: '#fff' }}>JPEG, PNG, WebP, HEIC or HEIF</p>
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
              accept={acceptedImageTypes}
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files) void addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Preview strip */}
          {files.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
              {files.slice(0, 12).map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setThumbnailName(f.name)}
                  title={thumbnailName === f.name ? 'Current thumbnail' : 'Set as thumbnail'}
                  style={{ width: '68px', height: '68px', padding: '2px', border: thumbnailName === f.name ? '2px solid #fff' : '2px solid transparent', background: 'transparent', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                >
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: thumbnailName === f.name ? 1 : 0.55 }}
                  />
                  {thumbnailName === f.name && <span style={{ position: 'absolute', left: 3, right: 3, bottom: 3, padding: '3px', background: 'rgba(0,0,0,.75)', color: '#fff', ...labelStyle, fontSize: '6px' }}>Thumbnail</span>}
                </button>
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
          <button onClick={submit} disabled={uploading || converting} style={{ ...labelStyle, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '9px 20px', cursor: uploading || converting ? 'default' : 'pointer', opacity: uploading || converting ? 0.5 : 1 }}>
            {converting ? 'Preparing images…' : uploading ? uploadStatus || `Uploading ${files.length} images…` : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}
