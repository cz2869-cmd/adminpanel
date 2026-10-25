'use server'

import { requireAdmin } from '@/lib/auth'
import { explainQuery } from '@/lib/manage'
import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

type FieldKind = 'text' | 'number' | 'bool'

const tables = {
  terms: {
    path: '/terms',
    create: true,
    update: true,
    remove: true,
    fields: { name: 'text', body: 'text' },
  },
  ai_generation_examples: {
    path: '/examples',
    create: true,
    update: true,
    remove: true,
    fields: { title: 'text', input_text: 'text', output_text: 'text' },
  },
  llm_providers: {
    path: '/providers',
    create: true,
    update: true,
    remove: true,
    fields: { name: 'text', slug: 'text', base_url: 'text' },
  },
  llm_models: {
    path: '/models',
    create: true,
    update: true,
    remove: true,
    fields: { provider_id: 'number', name: 'text', model_key: 'text' },
  },
  allowed_signup_domains: {
    path: '/domains',
    create: true,
    update: true,
    remove: true,
    fields: { domain: 'text' },
  },
  whitelisted_emails: {
    path: '/whitelist',
    create: true,
    update: true,
    remove: true,
    fields: { email: 'text' },
  },
  prompt_chain_mix: {
    path: '/mix',
    create: false,
    update: true,
    remove: false,
    fields: {
      chain_id: 'number',
      model_id: 'number',
      weight: 'number',
      is_active: 'bool',
    },
  },
} as const

type TableName = keyof typeof tables

function clean(table: TableName, input: Record<string, unknown>) {
  const spec = tables[table].fields
  const values: Record<string, string | number | boolean | null> = {}

  for (const [key, kind] of Object.entries(spec) as [string, FieldKind][]) {
    const raw = input[key]
    if (kind === 'bool') {
      values[key] = raw === true || raw === 'true' || raw === 'on'
      continue
    }
    if (kind === 'number') {
      const number = Number(raw)
      if (raw === '' || raw == null || !Number.isFinite(number)) {
        return { error: `${key.replaceAll('_', ' ')} needs a number.` }
      }
      values[key] = number
      continue
    }
    const text = String(raw ?? '').trim()
    if (!text && key !== 'base_url') {
      return { error: `${key.replaceAll('_', ' ')} is required.` }
    }
    const normalized =
      key === 'domain' || key === 'email' || key === 'slug' ? text.toLowerCase() : text
    values[key] = normalized || null
  }

  return { values }
}

async function writer(table: TableName) {
  const access = await requireAdmin()
  if (!access.ok) {
    return { supabase: null, error: 'Admins only.' }
  }
  return { supabase: await createClient(), error: null, table }
}

export async function createRecord(table: TableName, input: Record<string, unknown>) {
  if (!tables[table].create) {
    return { error: 'This record cannot be created here.' }
  }
  const client = await writer(table)
  if (!client.supabase) {
    return { error: client.error }
  }
  const cleaned = clean(table, input)
  if ('error' in cleaned) {
    return { error: cleaned.error }
  }
  const { error } = await client.supabase.from(table).insert(cleaned.values)
  if (error) {
    return { error: explainQuery(error.message) }
  }
  revalidatePath(tables[table].path)
  return {}
}

export async function updateRecord(
  table: TableName,
  id: number,
  input: Record<string, unknown>
) {
  if (!tables[table].update) {
    return { error: 'This record cannot be updated here.' }
  }
  const client = await writer(table)
  if (!client.supabase) {
    return { error: client.error }
  }
  const cleaned = clean(table, input)
  if ('error' in cleaned) {
    return { error: cleaned.error }
  }
  const { data, error } = await client.supabase
    .from(table)
    .update(cleaned.values)
    .eq('id', id)
    .select('id')
  if (error) {
    return { error: explainQuery(error.message) }
  }
  if (!data?.length) {
    return { error: 'That row was not updated.' }
  }
  revalidatePath(tables[table].path)
  return {}
}

export async function deleteRecord(table: TableName, id: number) {
  if (!tables[table].remove) {
    return { error: 'This record cannot be deleted here.' }
  }
  const client = await writer(table)
  if (!client.supabase) {
    return { error: client.error }
  }
  const { data, error } = await client.supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select('id')
  if (error) {
    return { error: explainQuery(error.message) }
  }
  if (!data?.length) {
    return { error: 'That row was not deleted.' }
  }
  revalidatePath(tables[table].path)
  return {}
}
