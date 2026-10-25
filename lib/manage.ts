import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/server'

export function explainQuery(message: string) {
  if (/does not exist|schema cache|could not find the (table|function)/i.test(message)) {
    return 'Run supabase/llm-admin.sql in the Supabase SQL editor, then refresh.'
  }
  return message
}

export async function loadRows<T>(table: string, columns: string) {
  const access = await requireAdmin()
  if (!access.ok) {
    return { rows: [] as T[], error: 'Admins only.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from(table).select(columns)
  if (error) {
    return { rows: [] as T[], error: explainQuery(error.message) }
  }
  return { rows: (data ?? []) as T[], error: null }
}
