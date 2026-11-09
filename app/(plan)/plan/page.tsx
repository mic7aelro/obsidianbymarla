import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'
import PlanShell from '@/components/plan/PlanShell'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Feed Plan',
  robots: { index: false, follow: false },
  // Lets Marla "Add to Home Screen" in Safari and open the planner full-screen like an app
  appleWebApp: {
    capable: true,
    title: 'Feed Plan',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#050505',
}

export default async function PlanPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login?next=/plan')

  return <PlanShell />
}
