import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Model = {
  id: number
  provider_id: number
  name: string
  model_key: string
}

type Provider = { id: number; name: string }

export default async function ModelsPage() {
  const models = await loadRows<Model>('llm_models', 'id, provider_id, name, model_key')
  const providers = await loadRows<Provider>('llm_providers', 'id, name')
  const error = models.error ?? providers.error

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete models</p>
          <h1>Models</h1>
        </div>
        <p className="muted">Model key is the name sent to the provider, such as gemini-3-flash-preview.</p>
      </header>
      {error ? (
        <p className="error">{error}</p>
      ) : providers.rows.length === 0 ? (
        <p className="empty">Add a provider before adding a model.</p>
      ) : (
        <EditableRecords
          table="llm_models"
          canCreate
          canUpdate
          canDelete
          columns={[
            {
              key: 'provider_id',
              label: 'Provider',
              kind: 'select',
              options: providers.rows.map((provider) => ({
                value: String(provider.id),
                label: provider.name,
              })),
            },
            { key: 'name', label: 'Name' },
            { key: 'model_key', label: 'Model key' },
          ]}
          rows={models.rows}
        />
      )}
    </>
  )
}
