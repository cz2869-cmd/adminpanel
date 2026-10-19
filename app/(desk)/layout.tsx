import DeskNav from '@/app/components/desk-nav'
import SignOutButton from '@/app/components/sign-out-button'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await requireAdmin()
  if (!access.ok) {
    redirect(access.reason === 'denied' ? '/denied' : '/')
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <strong>Nook Desk</strong>
          <small>Staff side</small>
        </div>
        <DeskNav />
        <div>
          <p className="who">{access.name}</p>
          <SignOutButton />
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  )
}
