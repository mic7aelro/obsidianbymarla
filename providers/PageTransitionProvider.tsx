'use client'

import { createContext, useContext, useRef, useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { gsap } from 'gsap'

interface TransitionContextValue {
  navigate: (href: string, branded?: boolean) => void
}

const TransitionContext = createContext<TransitionContextValue>({ navigate: () => {} })

export function useTransition() {
  return useContext(TransitionContext)
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLDivElement>(null)
  const isBrandedRef = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // When pathname changes, fade out overlay (if branded) then fade in page
  useEffect(() => {
    if (!mounted) return
    if (pathname.startsWith('/admin')) return
    const overlay = overlayRef.current
    const main = document.querySelector('main')
    if (!main) return

    if (isBrandedRef.current && overlay) {
      isBrandedRef.current = false
      // Overlay is fully opaque — fade it out, then reveal page
      gsap.set(main, { opacity: 0 })
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.7,
        delay: 0.1,
        ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
        onComplete: () => {
          overlay.style.pointerEvents = 'none'
          gsap.to(main, { opacity: 1, duration: 1.0, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        },
      })
    } else {
      // Subtle fade in for nav transitions
      gsap.fromTo(main, { opacity: 0 }, { opacity: 1, duration: 1.0, delay: 0.1, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
    }
  }, [pathname, mounted])

  const navigate = useCallback((href: string, branded = false) => {
    if (href.startsWith('/admin')) {
      router.push(href)
      return
    }
    const overlay = overlayRef.current
    const wordmark = wordmarkRef.current
    if (!overlay || !wordmark) {
      router.push(href)
      return
    }

    if (branded) {
      // Overlay in → wordmark in → hold → wordmark out → navigate (overlay stays opaque)
      overlay.style.pointerEvents = 'all'
      isBrandedRef.current = true
      const tl = gsap.timeline()
      tl.set(wordmark, { opacity: 0 })
        .to(overlay, { opacity: 1, duration: 0.5, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        .to(wordmark, { opacity: 1, duration: 1.2, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        .to(wordmark, { opacity: 1, duration: 0.6 }) // hold
        .to(wordmark, {
          opacity: 0,
          duration: 0.5,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          onComplete: () => { router.push(href) },
        })
    } else {
      // Subtle fade out → navigate
      const main = document.querySelector('main')
      if (main) {
        gsap.to(main, {
          opacity: 0,
          duration: 0.3,
          ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
          onComplete: () => router.push(href),
        })
      } else {
        router.push(href)
      }
    }
  }, [router])

  if (!mounted) return <>{children}</>

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}

      {/* Full-screen transition overlay */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={wordmarkRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0,
          }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(4rem, 14vw, 10rem)',
            fontWeight: 300,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#fff',
            lineHeight: 1,
          }}>
            Obsidian
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.55rem, 1.2vw, 0.75rem)',
            fontWeight: 400,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#fff',
            opacity: 0.5,
            marginTop: '0.75rem',
          }}>
            By Marla Chelsea McLeod
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
