import { ReadTable } from '@/app/components/read-table'
import { when } from '@/lib/format'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type RequestRow = {
  id: number
  user_id: string | null
  chain_id: number | null
  prompt: string
  created_at: string
}

type Named = { id: number; name: string }

export default async function RequestsPage() {
  const requests = await loadRows<RequestRow>(
    'generation_requests',
    'id, user_id, chain_id, prompt, created_at'
  )
  const chains = await loadRows<Named>('prompt_chains', 'id, name')
  const names = new Map(chains.rows.map((chain) => [chain.id, chain.name]))
  const error = requests.error ?? chains.error

  const rows = requests.rows
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({
      id: row.id,
      when: when(row.created_at),
      chain: row.chain_id ? (names.get(row.chain_id) ?? String(row.chain_id)) : '—',
      user: row.user_id ?? 'Not signed in',
      prompt: row.prompt,
    }))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read generation requests</p>
          <h1>Generation requests</h1>
        </div>
        <p className="muted">
          Morningside Nook writes a row each time a model answers a suggestion.
        </p>
      </header>
      {error ? <p className="error">{error}</p> : <ReadTable
        columns={[
          { key: 'when', label: 'When' },
          { key: 'chain', label: 'Chain' },
          { key: 'user', label: 'User' },
          { key: 'prompt', label: 'Prompt' },
        ]}
        rows={rows}
      />}
    </>
  )
}
