'use client'

import { createClient } from '@/lib/client'

export default function SignOutButton() {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button className="ghostButton" type="button" onClick={signOut}>
      Sign out
    </button>
  )
}
