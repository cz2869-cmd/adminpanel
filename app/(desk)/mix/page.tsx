import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Mix = {
  id: number
  chain_id: number
  model_id: number
  weight: number
  is_active: boolean
}

type Named = { id: number; name: string }

export default async function MixPage() {
  const mix = await loadRows<Mix>(
    'prompt_chain_mix',
    'id, chain_id, model_id, weight, is_active'
  )
  const chains = await loadRows<Named>('prompt_chains', 'id, name')
  const models = await loadRows<Named>('llm_models', 'id, name')
  const error = mix.error ?? chains.error ?? models.error

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read and update prompt chain mix</p>
          <h1>Prompt mix</h1>
        </div>
        <p className="muted">
          Weight says how often a model is chosen for a chain. Active rows are
          the ones the desk keeps.
        </p>
      </header>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <EditableRecords
          table="prompt_chain_mix"
          canUpdate
          columns={[
            {
              key: 'chain_id',
              label: 'Chain',
              kind: 'select',
              options: chains.rows.map((chain) => ({
                value: String(chain.id),
                label: chain.name,
              })),
            },
            {
              key: 'model_id',
              label: 'Model',
              kind: 'select',
              options: models.rows.map((model) => ({
                value: String(model.id),
                label: model.name,
              })),
            },
            { key: 'weight', label: 'Weight', kind: 'number' },
            { key: 'is_active', label: 'Active', kind: 'bool' },
          ]}
          rows={mix.rows}
        />
      )}
    </>
  )
}
