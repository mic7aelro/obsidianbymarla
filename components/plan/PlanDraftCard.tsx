'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PlanDraft } from '@/types/plan'
import styles from './PlanShell.module.css'

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
      : { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  })

  return (
    <article
      ref={setNodeRef}
      className={`${styles.gridCell} ${styles.draftCell} ${selected ? styles.selectedCell : ''} ${isDragging ? styles.draggingCell : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={draft.mediaUrl}
        alt={draft.caption || `Planned post ${index + 1}`}
        width={draft.width}
        height={draft.height}
        loading="lazy"
        className={styles.media}
      />

      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.selectDraft}
        aria-label={`Edit or move planned post ${index + 1}`}
        onClick={onSelect}
        {...attributes}
        {...listeners}
      />
    </article>
  )
}
