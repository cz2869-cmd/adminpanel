import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Term = { id: number; name: string; body: string }

export default async function TermsPage() {
  const result = await loadRows<Term>('terms', 'id, name, body')

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete terms</p>
          <h1>Terms</h1>
        </div>
        <p className="muted">Short definitions the desk can keep next to the prompts.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <EditableRecords
          table="terms"
          canCreate
          canUpdate
          canDelete
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'body', label: 'Definition', kind: 'textarea' },
          ]}
          rows={result.rows}
        />
      )}
    </>
  )
}
