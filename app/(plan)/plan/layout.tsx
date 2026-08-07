import type { ReactNode } from 'react'

export default function PlanLayout({ children }: { children: ReactNode }) {
  return <div className="plan-route">{children}</div>
}
