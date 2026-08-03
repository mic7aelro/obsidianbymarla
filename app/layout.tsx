import type { Metadata } from 'next'
import './globals.css'
import { cormorant, dmSans } from '@/lib/fonts'
import GrainOverlay from '@/components/layout/GrainOverlay'
import NavWrapper from '@/components/layout/NavWrapper'
import SmoothScrollProvider from '@/providers/SmoothScrollProvider'
import PageTransitionProvider from '@/providers/PageTransitionProvider'
import Link from 'next/link'
import { mediaUrl } from '@/lib/media'

export const metadata: Metadata = {
  title: {
    default: 'Marla McLeod | Fashion Stylist & Photographer',
    template: '%s | Marla McLeod',
  },
  description:
    'Marla McLeod is a Miami-based fashion stylist, photographer, and creative director.',
  metadataBase: new URL('https://obsidianbymarla.com'),
  openGraph: {
    title: 'Marla McLeod | Fashion Stylist & Photographer',
    description: 'Fashion styling, photography, and creative direction by Marla McLeod.',
    images: [mediaUrl('/images/projects/rylee-2023/cover.jpg')],
  },
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
            <footer className="site-footer">
              <div className="site-footer__meta">
                <Link href="/about">About Marla</Link>
                <span>© 2026 All rights reserved</span>
              </div>
            </footer>
          </PageTransitionProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
