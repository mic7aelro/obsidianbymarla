'use client'

import { Suspense } from 'react'
import ContactForm from '@/components/contact/ContactForm'

export default function ContactPage() {
  return (
    <div className="split-page contact-page">
      <header className="split-page__intro">
        <h1 className="display-title">Contact</h1>
        <p className="prose">
          Available for editorial, wedding, commercial, and personal styling work. Tell Marla what
          you are making and what you need.
        </p>
        <p className="split-page__note">Serving the Greater Miami area</p>
      </header>

      <div className="split-page__content" style={{ alignSelf: 'center' }}>
        <Suspense fallback={<p className="form-message">Preparing the inquiry form...</p>}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
}
