import { ReadTable } from '@/app/components/read-table'
import { when } from '@/lib/format'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type ResponseRow = {
  id: number
  request_id: number | null
  model_id: number | null
  content: string
  created_at: string
}

type Named = { id: number; name: string }

export default async function ResponsesPage() {
  const responses = await loadRows<ResponseRow>(
    'llm_responses',
    'id, request_id, model_id, content, created_at'
  )
  const models = await loadRows<Named>('llm_models', 'id, name')
  const names = new Map(models.rows.map((model) => [model.id, model.name]))
  const error = responses.error ?? models.error

  const rows = responses.rows
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({
      id: row.id,
      when: when(row.created_at),
      request: row.request_id ?? '—',
      model: row.model_id ? (names.get(row.model_id) ?? String(row.model_id)) : '—',
      content: row.content,
    }))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read LLM responses</p>
          <h1>Model responses</h1>
        </div>
        <p className="muted">The text each model returned for a generation request.</p>
      </header>
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <ReadTable
          columns={[
            { key: 'when', label: 'When' },
            { key: 'request', label: 'Request' },
            { key: 'model', label: 'Model' },
            { key: 'content', label: 'Response' },
          ]}
          rows={rows}
        />
      )}
    </>
  )
}
