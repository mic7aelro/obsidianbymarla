'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProjectImage } from '@/types/project'
import GalleryLightbox from './GalleryLightbox'

export default function ProjectGallery({
  images,
  title,
}: {
  images: ProjectImage[]
  title: string
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <>
      <div
        style={{
          padding: '6rem 2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {images.map((img, i) => {
          const isLandscape = img.width > img.height
          return (
            <div
              key={i}
              onClick={() => setLightboxIndex(i)}
              style={{
                gridColumn: isLandscape ? 'span 2' : 'span 1',
                position: 'relative',
                aspectRatio: `${img.width} / ${img.height}`,
                overflow: 'hidden',
                background: '#111',
                cursor: 'pointer',
              }}
              data-cursor="view"
            >
              <Image
                src={img.src}
                alt={`${title} — image ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover', transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                onMouseEnter={e => ((e.target as HTMLImageElement).style.opacity = '0.85')}
                onMouseLeave={e => ((e.target as HTMLImageElement).style.opacity = '1')}
              />
            </div>
          )
        })}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
