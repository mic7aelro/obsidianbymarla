import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminPage() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  return <AdminShell />
}
