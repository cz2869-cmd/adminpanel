import { ReadTable } from '@/app/components/read-table'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Step = {
  id: number
  chain_id: number
  position: number
  role: string
  content: string
}

type Chain = { id: number; name: string }

export default async function StepsPage() {
  const steps = await loadRows<Step>(
    'prompt_chain_steps',
    'id, chain_id, position, role, content'
  )
  const chains = await loadRows<Chain>('prompt_chains', 'id, name')
  const names = new Map(chains.rows.map((chain) => [chain.id, chain.name]))
  const error = steps.error ?? chains.error

  const rows = steps.rows
    .slice()
    .sort((a, b) => a.chain_id - b.chain_id || a.position - b.position)
    .map((step) => ({
      ...step,
      chain: names.get(step.chain_id) ?? String(step.chain_id),
    }))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read prompt chain steps</p>
          <h1>Prompt steps</h1>
        </div>
        <p className="muted">Steps run in position order. System steps set the rules, then the user step fills in the request.</p>
      </header>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <ReadTable
          columns={[
            { key: 'chain', label: 'Chain' },
            { key: 'position', label: 'Position' },
            { key: 'role', label: 'Role' },
            { key: 'content', label: 'Content' },
          ]}
          rows={rows}
        />
      )}
    </>
  )
}
