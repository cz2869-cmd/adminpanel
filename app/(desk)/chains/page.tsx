import { ReadTable } from '@/app/components/read-table'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Chain = {
  id: number
  name: string
  description: string
  created_at: string
}

export default async function ChainsPage() {
  const result = await loadRows<Chain>(
    'prompt_chains',
    'id, name, description, created_at'
  )

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read prompt chains</p>
          <h1>Prompt chains</h1>
        </div>
        <p className="muted">Each chain is the script behind one kind of generation.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <ReadTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
          ]}
          rows={result.rows}
        />
      )}
    </>
  )
}
