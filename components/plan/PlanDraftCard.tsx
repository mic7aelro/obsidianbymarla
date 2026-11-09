'use client'

import Image from 'next/image'
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
  onSelect: () => void
}

export default function PlanDraftCard({
  draft,
  index,
  selected,
  reducedMotion,
  onSelect,
}: PlanDraftCardProps) {
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

  return (
    <article
      ref={setNodeRef}
      className={`${styles.gridCell} ${styles.draftCell} ${draft.placeholder ? styles.placeholderCell : ''} ${selected ? styles.selectedCell : ''} ${isDragging ? styles.draggingCell : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {draft.placeholder ? (
        <span className={styles.placeholderFill} aria-hidden="true" />
      ) : (
        <Image
          src={draft.mediaUrl}
          alt={draft.caption || `Planned post ${index + 1}`}
          width={draft.width}
          height={draft.height}
          sizes={DRAFT_IMAGE_SIZES}
          draggable={false}
          className={styles.media}
        />
      )}

      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.selectDraft}
        aria-label={draft.placeholder
          ? `Edit or move blank space ${index + 1}`
          : `Edit or move planned post ${index + 1}`}
        onClick={onSelect}
        {...attributes}
        {...listeners}
      />
    </article>
  )
}
