import GoogleButton from '@/app/components/google-button'
import SignOutButton from '@/app/components/sign-out-button'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const access = await requireAdmin()
  if (access.ok) {
    redirect('/desk')
  }
  if (access.reason === 'denied') {
    redirect('/denied')
  }

  return (
    <main className="gate">
      <section className="gateCard">
        <p className="eyebrow">Morningside Nook</p>
        <h1>Nook Desk</h1>
        <p className="lede">
          The staff side of the cafe database. Google sign-in is required, and
          only a profile with <code>is_superadmin</code> can open the desk.
        </p>
        {access.reason === 'setup' ? <SignOutButton /> : <GoogleButton />}
      </section>
    </main>
  )
}
