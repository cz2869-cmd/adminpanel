'use server'

import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

type Result = { error?: string }

const outcomes = ['pending', 'accepted', 'rejected'] as const

async function adminClient() {
  const access = await requireAdmin()
  if (!access.ok) {
    return { supabase: null, userId: null, error: 'Sign in as a superadmin first.' }
  }
  return { supabase: await createClient(), userId: access.userId, error: null }
}

function cleanSuggestion(input: {
  cafeId: number
  vibes: string
  note: string
  reason: string
  outcome: string
}) {
  const vibes = input.vibes
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
  const note = input.note.trim().slice(0, 240)
  const reason = input.reason.trim().slice(0, 500)
  const outcome = outcomes.includes(input.outcome as (typeof outcomes)[number])
    ? input.outcome
    : 'pending'

  if (!input.cafeId || !reason) {
    return { error: 'Choose a cafe and keep the suggestion text.' }
  }

  return { vibes, note, reason, outcome, cafeId: input.cafeId }
}

export async function createSuggestion(input: {
  cafeId: number
  vibes: string
  note: string
  reason: string
  outcome: string
}): Promise<Result> {
  const access = await adminClient()
  if (!access.supabase || !access.userId) {
    return { error: access.error ?? 'Admins only.' }
  }

  const clean = cleanSuggestion(input)
  if ('error' in clean) {
    return { error: clean.error }
  }

  const { data, error } = await access.supabase
    .from('cafe_suggestions')
    .insert({
      user_id: access.userId,
      cafe_id: clean.cafeId,
      vibes: clean.vibes,
      note: clean.note,
      reason: clean.reason,
      outcome: clean.outcome,
      client_token: crypto.randomUUID(),
    })
    .select('id')

  if (error) {
    return { error: error.message }
  }
  if (!data?.length) {
    return { error: 'The suggestion was not created.' }
  }

  revalidatePath('/suggestions')
  revalidatePath('/desk')
  return {}
}

export async function updateSuggestion(
  id: number,
  input: {
    cafeId: number
    vibes: string
    note: string
    reason: string
    outcome: string
  }
): Promise<Result> {
  const access = await adminClient()
  if (!access.supabase) {
    return { error: access.error ?? 'Admins only.' }
  }

  const clean = cleanSuggestion(input)
  if ('error' in clean) {
    return { error: clean.error }
  }

  const { data, error } = await access.supabase
    .from('cafe_suggestions')
    .update({
      cafe_id: clean.cafeId,
      vibes: clean.vibes,
      note: clean.note,
      reason: clean.reason,
      outcome: clean.outcome,
    })
    .eq('id', id)
    .select('id')

  if (error) {
    return { error: error.message }
  }
  if (!data?.length) {
    return { error: 'That suggestion was not updated.' }
  }

  revalidatePath('/suggestions')
  revalidatePath('/desk')
  return {}
}

export async function deleteSuggestion(id: number): Promise<Result> {
  const access = await adminClient()
  if (!access.supabase) {
    return { error: access.error ?? 'Admins only.' }
  }

  const { data, error } = await access.supabase
    .from('cafe_suggestions')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) {
    return { error: error.message }
  }
  if (!data?.length) {
    return { error: 'That suggestion was not deleted.' }
  }

  revalidatePath('/suggestions')
  revalidatePath('/desk')
  return {}
}
