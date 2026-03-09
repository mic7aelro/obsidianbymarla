import ProjectGrid from '@/components/work/ProjectGrid'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Work — Marla McLeod',
}

export default function WorkPage() {
  return (
    <>
      <div className="mobile-pad-top" style={{ padding: '7rem 2.5rem 0' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 8vw, 8rem)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: '0.75rem',
          }}
        >
          Work
        </h1>
      </div>
      <ProjectGrid />
    </>
  )
}
