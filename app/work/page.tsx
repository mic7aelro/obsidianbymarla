import ProjectGrid from '@/components/work/ProjectGrid'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Work',
  description: 'Selected fashion styling, editorial, runway, and portrait work by Marla McLeod.',
}

export default function WorkPage() {
  return (
    <>
      <header className="page-intro">
        <h1 className="display-title">Work</h1>
        <p className="page-intro__copy">
          Editorial, runway, portrait, and styling stories shaped around the people inside them.
        </p>
      </header>
      <ProjectGrid />
    </>
  )
}
