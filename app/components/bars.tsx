export default function Bars({
  rows,
}: {
  rows: { label: string; value: number; note?: string }[]
}) {
  const max = Math.max(1, ...rows.map((row) => row.value))

  if (rows.length === 0) {
    return <p className="empty">Nothing recorded yet.</p>
  }

  return (
    <ul className="bars">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="barMeta">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <div className="barTrack" aria-hidden="true">
            <div
              className="barFill"
              style={{
                width: `${row.value === 0 ? 0 : Math.max(8, (row.value / max) * 100)}%`,
              }}
            />
          </div>
          {row.note ? <p className="barNote">{row.note}</p> : null}
        </li>
      ))}
    </ul>
  )
}
