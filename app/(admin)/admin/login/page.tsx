'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'

type Step = 'email' | 'code'

const REMEMBERED_EMAIL_KEY = 'admin_remembered_email'

const labelStyle: CSSProperties = {
  color: 'rgba(242,240,236,0.48)',
  fontFamily: 'var(--font-sans)',
  fontSize: '9px',
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
}

const checkboxLabelStyle: CSSProperties = {
  color: 'rgba(242,240,236,0.72)',
  fontFamily: 'var(--font-sans)',
  fontSize: '10px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
}

const inputStyle: CSSProperties = {
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid rgba(242,240,236,0.24)',
  borderRadius: 0,
  color: '#f2f0ec',
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  outline: 0,
  padding: '12px 0',
  width: '100%',
}

const buttonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(242,240,236,0.28)',
  borderRadius: 0,
  color: '#f2f0ec',
  fontFamily: 'var(--font-sans)',
  fontSize: '9px',
  letterSpacing: '0.35em',
  padding: '15px 24px',
  textTransform: 'uppercase',
  transition: 'border-color 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  width: '100%',
}

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [remember, setRemember] = useState(true)

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      const response = await fetch('/api/admin/login/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'The code could not be sent.')
        return
      }

      setCode('')
      setStep('code')
    } catch {
      setError('The code could not be sent.')
    } finally {
      setPending(false)
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      const response = await fetch('/api/admin/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, remember }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'The code could not be verified.')
        return
      }

      if (remember) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }

      const adminHost = window.location.hostname.startsWith('admin.')
      const requestedPath = new URLSearchParams(window.location.search).get('next')
      const safePath = requestedPath === '/plan' || requestedPath?.startsWith('/admin/')
        ? requestedPath
        : null
      window.location.assign(safePath ?? (adminHost ? '/home' : '/admin/home'))
    } catch {
      setError('The code could not be verified.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#050505',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '8rem 1.5rem 3rem',
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          left: 0,
          padding: '2rem var(--page-gutter)',
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 2,
        }}
      >
        <a
          href="https://www.obsidianbymarla.com/"
          style={{
            color: '#f2f0ec',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            justifySelf: 'start',
            letterSpacing: '0.3em',
            opacity: 0.72,
            textTransform: 'uppercase',
          }}
        >
          Home
        </a>

        <a
          href="https://www.obsidianbymarla.com/"
          style={{
            color: '#f2f0ec',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(11px, 1.1vw, 15px)',
            fontWeight: 300,
            gridColumn: 2,
            justifySelf: 'center',
            letterSpacing: '0.25em',
            textAlign: 'center',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Obsidian by Marla Chelsea McLeod
        </a>

        <span aria-hidden="true" />
      </header>

      <div style={{ maxWidth: '420px', width: '100%' }}>
        <p
          style={{
            color: '#f2f0ec',
            fontFamily: 'var(--font-display)',
            fontSize: '30px',
            fontWeight: 300,
            letterSpacing: '0.12em',
            marginBottom: '3rem',
            textTransform: 'uppercase',
          }}
        >
          Marla McLeod
        </p>

        {step === 'email' ? (
          <form onSubmit={requestCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="admin-email" style={labelStyle}>Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              role="checkbox"
              aria-checked={remember}
              onClick={() => setRemember(value => !value)}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                gap: '0.6rem',
                justifySelf: 'start',
                padding: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  alignItems: 'center',
                  background: remember ? '#f2f0ec' : 'transparent',
                  border: '1px solid rgba(242,240,236,0.4)',
                  borderRadius: 0,
                  color: '#050505',
                  display: 'inline-flex',
                  flexShrink: 0,
                  fontSize: '10px',
                  height: '14px',
                  justifyContent: 'center',
                  lineHeight: 1,
                  width: '14px',
                }}
              >
                {remember ? '✓' : ''}
              </span>
              <span style={checkboxLabelStyle}>Keep me signed in</span>
            </button>

            {error && (
              <p role="alert" style={{ color: '#ffaaa0', fontFamily: 'var(--font-sans)', fontSize: '12px', lineHeight: 1.6 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{ ...buttonStyle, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}
            >
              {pending ? 'Sending...' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'rgba(242,240,236,0.58)', fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.7 }}>
              A 6-digit code was sent to <span style={{ color: '#f2f0ec' }}>{email}</span>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="admin-code" style={labelStyle}>Verification code</label>
              <input
                id="admin-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, fontSize: '20px', letterSpacing: '0.45em' }}
              />
            </div>

            {error && (
              <p role="alert" style={{ color: '#ffaaa0', fontFamily: 'var(--font-sans)', fontSize: '12px', lineHeight: 1.6 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{ ...buttonStyle, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.5 : 1 }}
            >
              {pending ? 'Verifying...' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setError('')
              }}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: 0,
                color: 'rgba(242,240,236,0.5)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                padding: '0.25rem 0',
                textTransform: 'uppercase',
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
