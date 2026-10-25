import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Provider = { id: number; name: string; slug: string; base_url: string | null }

export default async function ProvidersPage() {
  const result = await loadRows<Provider>('llm_providers', 'id, name, slug, base_url')

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete providers</p>
          <h1>Model providers</h1>
        </div>
        <p className="muted">The companies that host the models, starting with Google.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <EditableRecords
          table="llm_providers"
          canCreate
          canUpdate
          canDelete
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'slug', label: 'Slug' },
            { key: 'base_url', label: 'Base URL' },
          ]}
          rows={result.rows}
        />
      )}
    </>
  )
}
