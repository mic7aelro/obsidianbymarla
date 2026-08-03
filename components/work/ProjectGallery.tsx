'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProjectImage } from '@/types/project'
import GalleryLightbox from './GalleryLightbox'

export default function ProjectGallery({ images, title }: { images: ProjectImage[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <>
      <div className="project-gallery">
        {images.map((image, index) => {
          const isLandscape = image.width > image.height
          return (
            <button
              className="project-gallery__item"
              key={image.src}
              data-landscape={isLandscape}
              onClick={() => setLightboxIndex(index)}
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
              aria-label={`Open ${title}, image ${index + 1} of ${images.length}`}
            >
              <Image
                className="project-gallery__image"
                src={image.src}
                alt={`${title}, image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            </button>
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
