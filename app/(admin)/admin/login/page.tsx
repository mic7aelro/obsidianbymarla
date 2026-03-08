'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Incorrect password. Try again.')
      setPassword('')
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <a
        href="/"
        style={{
          position: 'fixed',
          top: '28px',
          left: '32px',
          fontFamily: 'var(--font-sans)',
          fontSize: '9px',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none',
        }}
      >
        Home
      </a>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 24px' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#fff',
            marginBottom: '48px',
          }}
        >
          Marla McLeod
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="username"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: '#fff',
                opacity: 0.45,
              }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                padding: '10px 0',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              htmlFor="password"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px',
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: '#fff',
                opacity: 0.45,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${error ? 'rgba(255,100,100,0.5)' : 'rgba(255,255,255,0.2)'}`,
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  padding: '10px 32px 10px 0',
                  outline: 'none',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'rgba(255,255,255,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? (
                  // Eye-off
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Eye
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.05em',
                color: 'rgba(255,100,100,0.85)',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              padding: '14px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
