'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from '@phosphor-icons/react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PlanDraft } from '@/types/plan'
import styles from './PlanShell.module.css'

// Grid cells are a third of the feed column, so request thumbnails, not phone originals
export const DRAFT_IMAGE_SIZES = '(max-width: 780px) 34vw, 300px'

interface PlanDraftCardProps {
  draft: PlanDraft
  index: number
  selected: boolean
  reducedMotion: boolean
  // Object URL of a just-picked photo, shown until the uploaded copy has loaded
  localPreview?: string
  uploading: boolean
  onSelect: () => void
  onRemove: () => Promise<void>
  onPreviewSettled: () => void
}

export default function PlanDraftCard({
  draft,
  index,
  selected,
  reducedMotion,
  localPreview,
  uploading,
  onSelect,
  onRemove,
  onPreviewSettled,
}: PlanDraftCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: draft.id,
    transition: reducedMotion
      ? null
      : { duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  })

  async function remove() {
    setRemoving(true)
    try {
      await onRemove()
    } finally {
      setRemoving(false)
      setConfirming(false)
    }
  }

  const label = draft.placeholder ? `blank space ${index + 1}` : `planned post ${index + 1}`

  return (
    <article
      ref={setNodeRef}
      className={`${styles.gridCell} ${styles.draftCell} ${draft.placeholder ? styles.placeholderCell : ''} ${selected ? styles.selectedCell : ''} ${isDragging ? styles.draggingCell : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {draft.placeholder ? (
        !localPreview && <span className={styles.placeholderFill} aria-hidden="true" />
      ) : (
        <Image
          src={draft.mediaUrl}
          alt={draft.caption || `Planned post ${index + 1}`}
          width={draft.width}
          height={draft.height}
          sizes={DRAFT_IMAGE_SIZES}
          draggable={false}
          className={styles.media}
          onLoad={() => {
            if (localPreview && !uploading) onPreviewSettled()
          }}
        />
      )}

      {localPreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={localPreview} alt="" draggable={false} className={`${styles.media} ${styles.localPreview}`} />
      )}

      {uploading && <span className={styles.uploadingVeil} aria-label="Uploading photo" />}

      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.selectDraft}
        aria-label={draft.placeholder ? `Add a photo to ${label}, or hold to move` : `Edit or move ${label}`}
        onClick={onSelect}
        {...attributes}
        {...listeners}
      />

      {!confirming && !isDragging && (
        <button
          type="button"
          className={styles.removeChip}
          aria-label={`Remove ${label}`}
          onClick={() => setConfirming(true)}
        >
          <X size={12} weight="bold" />
        </button>
      )}

      {confirming && (
        <div className={styles.removeConfirm} role="alertdialog" aria-label={`Remove ${label}?`}>
          <p>Remove?</p>
          <button type="button" className={styles.removeConfirmYes} onClick={() => void remove()} disabled={removing}>
            {removing ? 'Removing' : 'Remove'}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={removing}>
            Keep
          </button>
        </div>
      )}
    </article>
  )
}
