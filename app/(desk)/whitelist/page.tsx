import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Allowed = { id: number; email: string }

export default async function WhitelistPage() {
  const result = await loadRows<Allowed>('whitelisted_emails', 'id, email')

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete emails</p>
          <h1>Allowed emails</h1>
        </div>
        <p className="muted">Individual addresses that can sign up even outside an allowed domain.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <EditableRecords
          table="whitelisted_emails"
          canCreate
          canUpdate
          canDelete
          columns={[{ key: 'email', label: 'Email' }]}
          rows={result.rows}
        />
      )}
    </>
  )
}
