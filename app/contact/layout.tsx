import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send a photography, styling, or creative direction inquiry to Marla McLeod.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
