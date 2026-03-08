'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label) return

    // Hide default cursor globally
    document.documentElement.style.cursor = 'none'

    const onMove = (e: MouseEvent) => {
      // Dot: direct style for zero lag
      dot.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
      // Label: slight follow for fluidity
      gsap.to(label, { x: e.clientX, y: e.clientY, duration: 0.12, ease: 'power2.out' })
    }

    const onEnterImage = () => {
      gsap.to(dot, { scale: 6, opacity: 0, duration: 0.35, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
      gsap.to(label, { opacity: 1, scale: 1, duration: 0.35, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
    }

    const onLeaveImage = () => {
      gsap.to(dot, { scale: 1, opacity: 1, duration: 0.35, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
      gsap.to(label, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
    }

    const attachImageListeners = () => {
      document.querySelectorAll<HTMLElement>('[data-cursor="view"]').forEach(el => {
        el.style.cursor = 'none'
        el.addEventListener('mouseenter', onEnterImage)
        el.addEventListener('mouseleave', onLeaveImage)
      })
    }

    window.addEventListener('mousemove', onMove)
    attachImageListeners()

    // Re-attach on DOM changes (Next.js route changes)
    const observer = new MutationObserver(attachImageListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.documentElement.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      observer.disconnect()
      document.querySelectorAll<HTMLElement>('[data-cursor="view"]').forEach(el => {
        el.removeEventListener('mouseenter', onEnterImage)
        el.removeEventListener('mouseleave', onLeaveImage)
      })
    }
  }, [])

  return (
    <>
      {/* 8px dot */}
      <div
        ref={dotRef}
        data-custom-cursor
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#fff',
          willChange: 'transform',
          pointerEvents: 'none',
          zIndex: 99999,
          mixBlendMode: 'difference',
        }}
      />
      {/* VIEW label */}
      <div
        ref={labelRef}
        data-custom-cursor
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 99999,
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          scale: '0.8',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          fontWeight: 400,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#fff',
          mixBlendMode: 'difference',
        }}
      >
        View
      </div>
    </>
  )
}
