import EditableRecords from '@/app/components/editable-records'
import { loadRows } from '@/lib/manage'

export const dynamic = 'force-dynamic'

type Example = {
  id: number
  title: string
  input_text: string
  output_text: string
}

export default async function ExamplesPage() {
  const result = await loadRows<Example>(
    'ai_generation_examples',
    'id, title, input_text, output_text'
  )

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Create, read, update, delete examples</p>
          <h1>Generation examples</h1>
        </div>
        <p className="muted">Sample inputs and the cafe answer you want to keep on file.</p>
      </header>
      {result.error ? (
        <p className="error">{result.error}</p>
      ) : (
        <EditableRecords
          table="ai_generation_examples"
          canCreate
          canUpdate
          canDelete
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'input_text', label: 'Input', kind: 'textarea' },
            { key: 'output_text', label: 'Output', kind: 'textarea' },
          ]}
          rows={result.rows}
        />
      )}
    </>
  )
}
