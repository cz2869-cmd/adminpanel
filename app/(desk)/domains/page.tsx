import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Domain = { id: number; domain: string }

export default async function DomainsPage() {
  const result = await loadRows<Domain>('allowed_signup_domains', 'id, domain')

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete domains</p>
          <h1>Signup domains</h1>
        </div>
        <p className="muted">Email domains that are allowed to create an account.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <EditableRecords
          table="allowed_signup_domains"
          canCreate
          canUpdate
          canDelete
          columns={[{ key: 'domain', label: 'Domain' }]}
          rows={result.rows}
        />
      )}
    </>
  )
}
