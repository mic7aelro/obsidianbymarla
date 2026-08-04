'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { serviceInquiryOptions } from '@/data/services'

const SERVICES = [...serviceInquiryOptions, 'Custom / Other']

export default function ContactForm() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    service: '',
    message: '',
  })

  useEffect(() => {
    const requestedService = searchParams.get('service')
    if (requestedService && SERVICES.includes(requestedService)) {
      setForm(previous => ({ ...previous, service: requestedService }))
    }
  }, [searchParams])

  const set = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(previous => ({ ...previous, [field]: event.target.value }))

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('sending')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Inquiry could not be sent')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-success" role="status">
        <h2 className="form-success__title">Inquiry received.</h2>
        <p className="form-message">Thank you for sharing your vision. Marla will be in touch soon.</p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} aria-busy={status === 'sending'}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name *</label>
          <input id="name" name="name" type="text" autoComplete="name" required value={form.name} onChange={set('name')} />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="form-field">
          <label htmlFor="location">Where are you located?</label>
          <input
            id="location"
            name="location"
            type="text"
            autoComplete="address-level2"
            placeholder="City, State"
            value={form.location}
            onChange={set('location')}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="service">Service *</label>
          <select id="service" name="service" required value={form.service} onChange={set('service')}>
            <option value="" disabled>Select a service</option>
            {SERVICES.map(service => <option key={service}>{service}</option>)}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="message">Your vision *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={set('message')}
          placeholder="Tell Marla about the project, timing, and what you need."
        />
      </div>

      {status === 'error' && (
        <p className="form-message" data-state="error" role="alert">
          Something went wrong. Please try again or reach out on Instagram.
        </p>
      )}

      <button className="form-submit" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Send inquiry'}
      </button>
    </form>
  )
}
