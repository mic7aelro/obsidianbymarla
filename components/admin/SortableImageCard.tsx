'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import styles from './CurateShell.module.css'

interface CurateImage {
  src: string
  width: number
  height: number
}

interface SortableImageCardProps {
  image: CurateImage
  index: number
  isSelected: boolean
  isHidden: boolean
  isThumbnail: boolean
  reducedMotion: boolean
  onSelect: () => void
  onToggleHidden: () => void
  onSetThumbnail: () => void
}

export default function SortableImageCard({
  image,
  index,
  isSelected,
  isHidden,
  isThumbnail,
  reducedMotion,
  onSelect,
  onToggleHidden,
  onSetThumbnail,
}: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.src,
    transition: reducedMotion ? null : {
      duration: 420,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cell} ${isSelected ? styles.cellSelected : ''} ${isDragging ? styles.cellDragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onSelect}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        loading="lazy"
        className={styles.cellImage}
        style={{ opacity: isHidden ? 0.22 : 1 }}
      />

      <button
        ref={setActivatorNodeRef}
        type="button"
        className={styles.moveHandle}
        onClick={event => event.stopPropagation()}
        aria-label={`Move image ${index + 1}. Press and hold, then drag to reorder.`}
        {...attributes}
        {...listeners}
      >
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className={styles.moveLabel}>Hold + move</span>
      </button>

      <div className={styles.badges}>
        {isThumbnail && <span className={styles.thumbnailBadge}>Thumbnail</span>}
        {isHidden && <span className={styles.hiddenBadge}>Hidden</span>}
      </div>

      {isSelected && <div className={styles.selectedMark}>✓</div>}

      <div className={styles.cellActions}>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onToggleHidden() }}
          className={styles.imageAction}
        >
          {isHidden ? 'Unhide' : 'Hide'}
        </button>
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onSetThumbnail() }}
          disabled={isThumbnail}
          className={`${styles.imageAction} ${isThumbnail ? styles.thumbnailActionActive : ''}`}
        >
          {isThumbnail ? 'Current thumbnail' : 'Set thumbnail'}
        </button>
      </div>
    </div>
  )
}
