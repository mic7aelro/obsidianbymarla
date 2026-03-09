'use client'

import { useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import type { ProjectImage } from '@/types/project'

export default function GalleryLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ProjectImage[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  const img = images[index]
  const isLandscape = img.width > img.height

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: isLandscape ? 'min(90vw, 1200px)' : 'min(60vw, 700px)',
          aspectRatio: `${img.width} / ${img.height}`,
          maxHeight: '90vh',
        }}
      >
        <Image
          src={img.src}
          alt=""
          fill
          sizes="(max-width: 768px) 95vw, 80vw"
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Counter */}
      <div
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      >
        {index + 1} / {images.length}
      </div>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); prev() }}
        style={{
          position: 'fixed',
          left: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          cursor: 'pointer',
          padding: '1rem',
        }}
        aria-label="Previous"
      >
        ←
      </button>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); next() }}
        style={{
          position: 'fixed',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          letterSpacing: '0.2em',
          cursor: 'pointer',
          padding: '1rem',
        }}
        aria-label="Next"
      >
        →
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2.5rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '0.5rem',
        }}
      >
        Close
      </button>
    </div>
  )
}
