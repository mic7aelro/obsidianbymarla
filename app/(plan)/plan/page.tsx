import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import PlanShell from '@/components/plan/PlanShell'
import { getSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Feed Plan',
  robots: { index: false, follow: false },
}

export default async function PlanPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login?next=/plan')

  return <PlanShell />
}
