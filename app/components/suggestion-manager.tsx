'use client'

import {
  createSuggestion,
  deleteSuggestion,
  updateSuggestion,
} from '@/app/actions'
import { cafeName, personName, when } from '@/lib/format'
import type { CafeRow, ProfileRow, SuggestionRow } from '@/lib/floor'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const outcomeLabel = {
  pending: 'No choice yet',
  accepted: 'Bring me there',
  rejected: 'Another suggestion',
} as const

type SuggestionManagerProps = {
  cafes: CafeRow[]
  profiles: ProfileRow[]
  suggestions: SuggestionRow[]
}

export default function SuggestionManager({
  cafes,
  profiles,
  suggestions,
}: SuggestionManagerProps) {
  const router = useRouter()
  const [notice, setNotice] = useState('')
  const [noticeError, setNoticeError] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const cafesById = new Map(cafes.map((cafe) => [cafe.id, cafe]))

  function remove(id: number) {
    if (!window.confirm('Delete this suggestion?')) {
      return
    }
    setNotice('')
    setNoticeError(false)
    startTransition(async () => {
      const result = await deleteSuggestion(id)
      if (result.error) {
        setNotice(result.error)
        setNoticeError(true)
        return
      }
      setNotice('Deleted.')
      router.refresh()
    })
  }

  return (
    <div className="stack">
      <div className="row">
        <button
          className="primaryButton"
          type="button"
          onClick={() => setCreating((open) => !open)}
        >
          {creating ? 'Close' : 'Create a record'}
        </button>
      </div>
      {creating ? (
        <SuggestionForm
          cafes={cafes}
          pending={pending}
          submitLabel="Create"
          onCancel={() => setCreating(false)}
          onSave={(input) => {
            setNotice('')
            setNoticeError(false)
            startTransition(async () => {
              const result = await createSuggestion(input)
              if (result.error) {
                setNotice(result.error)
                setNoticeError(true)
                return
              }
              setCreating(false)
              setNotice('Created.')
              router.refresh()
            })
          }}
        />
      ) : null}
      {notice ? (
        <p className={noticeError ? 'error' : 'muted'}>{notice}</p>
      ) : null}
      {suggestions.length === 0 ? (
        <p className="empty">
          Nothing here yet. On Morningside Nook, use Can&apos;t decide which cafe
          to visit? Each suggestion is saved on its own: the presets, the note,
          the cafe that was recommended, and whether they clicked Bring me there
          or asked for another one.
        </p>
      ) : null}
      {[...suggestions]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((suggestion) => {
          const cafe = cafesById.get(suggestion.cafe_id)
          const author = suggestion.user_id
            ? profilesById.get(suggestion.user_id)
            : null
          return (
            <article className="panel" key={suggestion.id}>
              <p className="eyebrow">
                {author ? personName(author) : 'Not signed in'} · {when(suggestion.created_at)}
              </p>
              {editing === suggestion.id ? (
                <SuggestionForm
                  cafes={cafes}
                  pending={pending}
                  submitLabel="Update"
                  onCancel={() => setEditing(null)}
                  onSave={(input) => {
                    setNotice('')
                    setNoticeError(false)
                    startTransition(async () => {
                      const result = await updateSuggestion(suggestion.id, input)
                      if (result.error) {
                        setNotice(result.error)
                        setNoticeError(true)
                        return
                      }
                      setEditing(null)
                      setNotice('Updated.')
                      router.refresh()
                    })
                  }}
                />
              ) : (
                <>
                  <div className="chips">
                    {suggestion.vibes.length === 0 ? (
                      <span className="chip">No preset</span>
                    ) : (
                      suggestion.vibes.map((vibe) => (
                        <span className="chip" key={vibe}>
                          {vibe}
                        </span>
                      ))
                    )}
                  </div>
                  <p>
                    <strong>They wrote: </strong>
                    {suggestion.note || 'Nothing'}
                  </p>
                  <h3>{cafe ? cafeName(cafe.name) : `Cafe ${suggestion.cafe_id}`}</h3>
                  <p className="muted">{suggestion.reason}</p>
                  <p className={`outcome outcome-${suggestion.outcome}`}>
                    {outcomeLabel[suggestion.outcome]}
                  </p>
                  <div className="row">
                    <button
                      className="ghostButton"
                      type="button"
                      onClick={() => setEditing(suggestion.id)}
                    >
                      Update
                    </button>
                    <button
                      className="dangerButton"
                      type="button"
                      onClick={() => remove(suggestion.id)}
                      disabled={pending}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          )
        })}
    </div>
  )
}

function SuggestionForm({
  cafes,
  pending,
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  cafes: CafeRow[]
  pending: boolean
  initial?: SuggestionRow
  submitLabel: string
  onSave: (input: {
    cafeId: number
    vibes: string
    note: string
    reason: string
    outcome: string
  }) => void
  onCancel?: () => void
}) {
  const [cafeId, setCafeId] = useState(initial?.cafe_id ?? cafes[0]?.id ?? 0)
  const [vibes, setVibes] = useState(initial?.vibes.join(', ') ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [reason, setReason] = useState(initial?.reason ?? '')
  const [outcome, setOutcome] = useState(initial?.outcome ?? 'pending')

  return (
    <form
      className={initial ? undefined : 'panel'}
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ cafeId, vibes, note, reason, outcome })
      }}
    >
      <label htmlFor={`cafe-${initial?.id ?? 'new'}`}>Suggested cafe</label>
      <select
        id={`cafe-${initial?.id ?? 'new'}`}
        value={cafeId}
        onChange={(event) => setCafeId(Number(event.target.value))}
      >
        {cafes.map((cafe) => (
          <option key={cafe.id} value={cafe.id}>
            {cafeName(cafe.name)}
          </option>
        ))}
      </select>
      <label htmlFor={`vibes-${initial?.id ?? 'new'}`}>Presets</label>
      <textarea
        id={`vibes-${initial?.id ?? 'new'}`}
        value={vibes}
        onChange={(event) => setVibes(event.target.value)}
        placeholder="Cozy, Studying"
      />
      <label htmlFor={`note-${initial?.id ?? 'new'}`}>What they wrote</label>
      <textarea
        id={`note-${initial?.id ?? 'new'}`}
        value={note}
        maxLength={240}
        onChange={(event) => setNote(event.target.value)}
      />
      <label htmlFor={`reason-${initial?.id ?? 'new'}`}>AI suggestion</label>
      <textarea
        id={`reason-${initial?.id ?? 'new'}`}
        value={reason}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
      />
      <label htmlFor={`outcome-${initial?.id ?? 'new'}`}>What they did</label>
      <select
        id={`outcome-${initial?.id ?? 'new'}`}
        value={outcome}
        onChange={(event) =>
          setOutcome(event.target.value as SuggestionRow['outcome'])
        }
      >
        <option value="pending">No choice yet</option>
        <option value="accepted">Bring me there</option>
        <option value="rejected">Another suggestion</option>
      </select>
      <div className="row">
        <button className="primaryButton" type="submit" disabled={pending}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button className="ghostButton" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
