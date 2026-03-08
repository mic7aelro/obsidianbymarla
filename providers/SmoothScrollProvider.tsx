'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return <>{children}</>
}
