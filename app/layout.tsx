import type { Metadata } from 'next'
import './globals.css'
import { cormorant, dmSans } from '@/lib/fonts'
import GrainOverlay from '@/components/layout/GrainOverlay'
import NavWrapper from '@/components/layout/NavWrapper'
import SmoothScrollProvider from '@/providers/SmoothScrollProvider'
import PageTransitionProvider from '@/providers/PageTransitionProvider'

export const metadata: Metadata = {
  title: 'Marla McLeod — Fashion Stylist & Photographer',
  description:
    'Marla McLeod is a Miami-based fashion stylist, photographer, and creative director.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <GrainOverlay />
        <SmoothScrollProvider>
          <PageTransitionProvider>
            <NavWrapper />
            <main>{children}</main>
            <footer style={{
              padding: '2rem 2.5rem',
              borderTop: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'right',
            }}>
              © 2026 — All rights reserved
            </footer>
          </PageTransitionProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
