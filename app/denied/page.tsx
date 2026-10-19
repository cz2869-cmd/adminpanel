import SignOutButton from '@/app/components/sign-out-button'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DeniedPage() {
  const access = await requireAdmin()
  if (access.ok) {
    redirect('/desk')
  }
  if (access.reason === 'signin' || access.reason === 'setup') {
    redirect('/')
  }

  return (
    <main className="gate">
      <section className="gateCard">
        <p className="eyebrow">Signed in</p>
        <h1>This desk is closed</h1>
        <p className="lede">
          Your Google account is real, but <code>profiles.is_superadmin</code>{' '}
          is not true for it. In the Supabase SQL editor, set that field on your
          own profile, then sign in again.
        </p>
        <SignOutButton />
      </section>
    </main>
  )
}
