export const metadata = {
  title: 'About — Marla McLeod',
}

export default function AboutPage() {
  return (
    <div style={{ padding: '14rem 2.5rem 10rem' }}>
      <div style={{ maxWidth: '900px' }}>
        {/* Portrait placeholder */}
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            aspectRatio: '3 / 4',
            background: '#111',
            marginBottom: '5rem',
          }}
        />

        <blockquote
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
            fontWeight: 300,
            lineHeight: 1.25,
            letterSpacing: '0.04em',
            fontStyle: 'italic',
            marginBottom: '3rem',
            maxWidth: '640px',
          }}
        >
          &ldquo;I praise you, for I am fearfully and wonderfully made.&rdquo;
          <cite
            style={{
              display: 'block',
              fontFamily: 'var(--font-sans)',
              fontSize: '9px',
              fontStyle: 'normal',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: 0.4,
              marginTop: '1rem',
            }}
          >
            Psalm 139:14
          </cite>
        </blockquote>

        <p className="prose">
          Marla Chelsea McLeod is a Miami-based fashion stylist, photographer, and creative
          director. Her work is rooted in the belief that authentic beauty needs no arrangement —
          only a witness willing to be present. She works across editorial, commercial, and personal
          projects, bringing the same unhurried attention to each.
        </p>
      </div>
    </div>
  )
}
