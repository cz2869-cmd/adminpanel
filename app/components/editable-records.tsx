'use client'

import { createRecord, deleteRecord, updateRecord } from '@/app/manage-actions'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type FieldKind = 'text' | 'textarea' | 'number' | 'bool' | 'select'

export type EditorColumn = {
  key: string
  label: string
  kind?: FieldKind
  options?: { value: string; label: string }[]
}

type Row = { id: number } & Record<string, unknown>

type TableName =
  | 'terms'
  | 'ai_generation_examples'
  | 'llm_providers'
  | 'llm_models'
  | 'allowed_signup_domains'
  | 'whitelisted_emails'
  | 'prompt_chain_mix'

export default function EditableRecords({
  table,
  columns,
  rows,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: {
  table: TableName
  columns: EditorColumn[]
  rows: Row[]
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [notice, setNotice] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ error?: string }>, done: string) {
    setNotice('')
    setFailed(false)
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        setNotice(result.error)
        setFailed(true)
        return
      }
      setEditing(null)
      setNotice(done)
      router.refresh()
    })
  }

  return (
    <div className="stack">
      {canCreate ? (
        <div className="row">
          <button className="primaryButton" type="button" onClick={() => setEditing('new')}>
            Create
          </button>
        </div>
      ) : null}
      {notice ? <p className={failed ? 'error' : 'muted'}>{notice}</p> : null}
      {editing === 'new' ? (
        <Editor
          columns={columns}
          pending={pending}
          submitLabel="Create"
          onCancel={() => setEditing(null)}
          onSave={(input) => run(() => createRecord(table, input), 'Created.')}
        />
      ) : null}
      {rows.length === 0 ? <p className="empty">No rows yet.</p> : null}
      {rows.map((row) => (
        <article className="panel" key={row.id}>
          {editing === row.id ? (
            <Editor
              columns={columns}
              pending={pending}
              initial={row}
              submitLabel="Update"
              onCancel={() => setEditing(null)}
              onSave={(input) => run(() => updateRecord(table, row.id, input), 'Updated.')}
            />
          ) : (
            <>
              {columns.map((column) => (
                <p key={column.key}>
                  <strong>{column.label}: </strong>
                  {showValue(row[column.key], column)}
                </p>
              ))}
              {canUpdate || canDelete ? (
                <div className="row">
                  {canUpdate ? (
                    <button className="ghostButton" type="button" onClick={() => setEditing(row.id)}>
                      Update
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      className="dangerButton"
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm('Delete this row?')) {
                          return
                        }
                        run(() => deleteRecord(table, row.id), 'Deleted.')
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </article>
      ))}
    </div>
  )
}

function showValue(value: unknown, column: EditorColumn) {
  if (column.kind === 'bool') {
    return value ? 'Yes' : 'No'
  }
  if (column.options) {
    return column.options.find((option) => option.value === String(value))?.label ?? String(value ?? '')
  }
  const text = value == null || value === '' ? '—' : String(value)
  return text
}

function Editor({
  columns,
  initial,
  pending,
  submitLabel,
  onSave,
  onCancel,
}: {
  columns: EditorColumn[]
  initial?: Row
  pending: boolean
  submitLabel: string
  onSave: (input: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {}
    for (const column of columns) {
      const current = initial?.[column.key]
      if (column.kind === 'bool') {
        next[column.key] = current ? 'true' : 'false'
      } else if (current == null || current === '') {
        next[column.key] = column.options?.[0]?.value ?? ''
      } else {
        next[column.key] = String(current)
      }
    }
    return next
  })

  return (
    <form
      className={initial ? undefined : 'panel'}
      onSubmit={(event) => {
        event.preventDefault()
        const input: Record<string, unknown> = {}
        for (const column of columns) {
          input[column.key] = column.kind === 'bool' ? values[column.key] === 'true' : values[column.key]
        }
        onSave(input)
      }}
    >
      {columns.map((column) => {
        const id = `${column.key}-${initial?.id ?? 'new'}`
        return (
          <div key={column.key}>
            <label htmlFor={id}>{column.label}</label>
            {column.kind === 'select' ? (
              <select
                id={id}
                value={values[column.key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [column.key]: event.target.value }))
                }
              >
                {column.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : column.kind === 'bool' ? (
              <select
                id={id}
                value={values[column.key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [column.key]: event.target.value }))
                }
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : column.kind === 'textarea' ? (
              <textarea
                id={id}
                value={values[column.key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [column.key]: event.target.value }))
                }
              />
            ) : (
              <input
                id={id}
                type={column.kind === 'number' ? 'number' : 'text'}
                step={column.kind === 'number' ? 'any' : undefined}
                value={values[column.key]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [column.key]: event.target.value }))
                }
              />
            )}
          </div>
        )
      })}
      <div className="row">
        <button className="primaryButton" type="submit" disabled={pending}>
          {submitLabel}
        </button>
        <button className="ghostButton" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
