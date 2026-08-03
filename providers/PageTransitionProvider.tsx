'use client'

import { createContext, useCallback, useContext, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from 'gsap'

interface TransitionContextValue {
  navigate: (href: string) => void
}

const TransitionContext = createContext<TransitionContextValue>({ navigate: () => {} })

export function useTransition() {
  return useContext(TransitionContext)
}

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    const main = document.querySelector('main')
    if (!main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.fromTo(
      main,
      { opacity: 0 },
      { opacity: 1, duration: 0.75, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    )
  }, [pathname])

  const navigate = useCallback((href: string) => {
    if (href === pathname) return
    if (href.startsWith('/admin') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(href)
      return
    }

    const main = document.querySelector('main')
    if (!main) {
      router.push(href)
      return
    }

    gsap.to(main, {
      opacity: 0,
      duration: 0.3,
      ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
      onComplete: () => router.push(href),
    })
  }, [pathname, router])

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
    </TransitionContext.Provider>
  )
}
