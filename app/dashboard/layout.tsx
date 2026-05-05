import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider>
      <DashboardShell>{children}</DashboardShell>
    </Auth0Provider>
  )
}
