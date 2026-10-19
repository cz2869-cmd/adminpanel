'use client'

import { createClient } from '@/lib/client'
import { useState } from 'react'

export default function GoogleButton() {
  const [pending, setPending] = useState(false)

  async function signIn() {
    setPending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setPending(false)
    }
  }

  return (
    <button className="primaryButton" type="button" onClick={signIn} disabled={pending}>
      {pending ? 'Opening Google...' : 'Sign in with Google'}
    </button>
  )
}
