export function ReadTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[]
  rows: Record<string, unknown>[]
}) {
  if (rows.length === 0) {
    return <p className="empty">No rows yet.</p>
  }

  return (
    <section className="panel tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)}>
              {columns.map((column) => (
                <td className="clip" key={column.key}>
                  {row[column.key] == null || row[column.key] === ''
                    ? '—'
                    : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
