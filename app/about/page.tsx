import Image from 'next/image'
import Link from 'next/link'
import { mediaUrl } from '@/lib/media'

export const metadata = {
  title: 'About',
  description: 'About Miami-based fashion stylist, photographer, and creative director Marla McLeod.',
}

export default function AboutPage() {
  return (
    <article className="about-page">
      <div className="about-page__image">
        <Image
          className="about-page__portrait"
          src={mediaUrl('/images/marla-portrait.jpg')}
          alt="Portrait of Marla Chelsea McLeod"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 55vw"
        />
      </div>
      <div className="about-page__copy">
        <h1 className="about-page__title">About Marla</h1>
        <blockquote className="about-page__quote">
          “I praise you, for I am fearfully and wonderfully made.”
        </blockquote>
        <p className="prose">
          Marla Chelsea McLeod is a Miami-based fashion stylist, photographer, and creative
          director. Her work is rooted in the belief that authentic beauty needs no arrangement,
          only a witness willing to be present. She works across editorial, commercial, and personal
          projects, bringing the same unhurried attention to each.
        </p>
        <Link className="text-link" href="/contact" style={{ marginTop: '2rem' }}>
          Send an inquiry
        </Link>
      </div>
    </article>
  )
}
