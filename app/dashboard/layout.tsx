import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { DashboardNav } from '@/components/layout/DashboardNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider>
      <div className="min-h-screen bg-stone-50 flex">
        <DashboardNav />
        <main className="flex-1 ml-60 min-h-screen">
          {children}
        </main>
      </div>
    </Auth0Provider>
  )
}
