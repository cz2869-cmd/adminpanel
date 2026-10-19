import Bars from '@/app/components/bars'
import { cafeName, personName, when } from '@/lib/format'
import { loadFloor } from '@/lib/floor'

export const dynamic = 'force-dynamic'

export default async function DeskPage() {
  const floor = await loadFloor()
  if (floor.error) {
    return <p className="error">{floor.error}</p>
  }

  const cafeById = new Map(floor.cafes.map((cafe) => [cafe.id, cafe]))
  const profileById = new Map(floor.profiles.map((profile) => [profile.id, profile]))
  const commentById = new Map(floor.comments.map((comment) => [comment.id, comment]))

  const visitsByCafe = count(floor.visits.map((visit) => visit.cafe_id))
  const visitBars = floor.cafes
    .map((cafe) => ({
      label: cafeName(cafe.name),
      value: visitsByCafe.get(cafe.id) ?? 0,
    }))
    .sort((a, b) => b.value - a.value)

  const stars = new Map<number, { total: number; count: number }>()
  for (const rating of floor.ratings) {
    const current = stars.get(rating.cafe_id) ?? { total: 0, count: 0 }
    current.total += rating.stars
    current.count += 1
    stars.set(rating.cafe_id, current)
  }
  const starBars = floor.cafes
    .map((cafe) => {
      const score = stars.get(cafe.id)
      return {
        label: cafeName(cafe.name),
        value: score ? Math.round((score.total / score.count) * 10) / 10 : 0,
        note: score ? `${score.count} rating${score.count === 1 ? '' : 's'}` : 'No ratings yet',
      }
    })
    .sort((a, b) => b.value - a.value)

  const votesByCafe = new Map<number, { up: number; down: number }>()
  for (const vote of floor.commentVotes) {
    const comment = vote.comment_id ? commentById.get(vote.comment_id) : undefined
    if (!comment) {
      continue
    }
    const current = votesByCafe.get(comment.cafe_id) ?? { up: 0, down: 0 }
    if (vote.value > 0) {
      current.up += 1
    } else {
      current.down += 1
    }
    votesByCafe.set(comment.cafe_id, current)
  }
  const voteBars = floor.cafes
    .map((cafe) => {
      const votes = votesByCafe.get(cafe.id) ?? { up: 0, down: 0 }
      return {
        label: cafeName(cafe.name),
        value: votes.up + votes.down,
        note: `${votes.up} up · ${votes.down} down`,
      }
    })
    .sort((a, b) => b.value - a.value)

  const pairCounts = new Map<string, number>()
  for (const visit of floor.visits) {
    const key = `${visit.user_id}:${visit.cafe_id}`
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
  }
  const returnsByCafe = new Map<number, number>()
  let returnVisits = 0
  for (const [key, visits] of pairCounts) {
    if (visits < 2) {
      continue
    }
    returnVisits += 1
    const cafeId = Number(key.split(':')[1])
    returnsByCafe.set(cafeId, (returnsByCafe.get(cafeId) ?? 0) + 1)
  }
  const returnBars = floor.cafes
    .map((cafe) => ({
      label: cafeName(cafe.name),
      value: returnsByCafe.get(cafe.id) ?? 0,
      note:
        (returnsByCafe.get(cafe.id) ?? 0) === 1
          ? '1 person came back'
          : `${returnsByCafe.get(cafe.id) ?? 0} people came back`,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)

  const regulars = [...count(floor.visits.map((visit) => visit.user_id))]
    .map(([id, value]) => ({
      label: personName(profileById.get(id) ?? null),
      value,
      note: value === 1 ? '1 visit' : `${value} visits`,
    }))
    .sort((a, b) => b.value - a.value)

  const ups = floor.commentVotes.filter((vote) => vote.value > 0).length
  const downs = floor.commentVotes.filter((vote) => vote.value < 0).length

  const activity: { at: string; title: string; detail?: string }[] = [
    ...floor.visits.map((visit) => ({
      at: visit.visited_at,
      title: `${personName(profileById.get(visit.user_id) ?? null)} visited ${cafeName(cafeById.get(visit.cafe_id)?.name ?? 'a cafe')}`,
    })),
    ...floor.comments.map((comment) => ({
      at: comment.created_at,
      title: `${personName(profileById.get(comment.user_id) ?? null)} commented on ${cafeName(cafeById.get(comment.cafe_id)?.name ?? 'a cafe')}`,
      detail: comment.body,
    })),
    ...floor.ratings.map((rating) => ({
      at: rating.created_at,
      title: `${personName(profileById.get(rating.user_id) ?? null)} gave ${rating.stars} stars to ${cafeName(cafeById.get(rating.cafe_id)?.name ?? 'a cafe')}`,
    })),
    ...floor.suggestions.map((suggestion) => ({
      at: suggestion.created_at,
      title: `${suggestion.user_id ? personName(profileById.get(suggestion.user_id) ?? null) : 'Someone'} got a suggestion for ${cafeName(cafeById.get(suggestion.cafe_id)?.name ?? 'a cafe')}`,
      detail:
        suggestion.outcome === 'accepted'
          ? 'Clicked Bring me there'
          : suggestion.outcome === 'rejected'
            ? 'Asked for another suggestion'
            : 'Has not chosen yet',
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Stats</p>
          <h1>Cafe activity</h1>
        </div>
        <p className="muted">Visits, stars, and votes from students.</p>
      </header>
      <section className="stats">
        <article className="stat">
          <span>Visits</span>
          <strong>{floor.visits.length}</strong>
        </article>
        <article className="stat">
          <span>Star ratings</span>
          <strong>{floor.ratings.length}</strong>
        </article>
        <article className="stat">
          <span>Votes</span>
          <strong>{ups + downs}</strong>
        </article>
        <article className="stat">
          <span>Came back</span>
          <strong>{returnVisits}</strong>
        </article>
      </section>
      <div className="grid">
        <section className="panel">
          <h2>Visits</h2>
          <Bars rows={visitBars} />
        </section>
        <section className="panel">
          <h2>Stars</h2>
          <Bars rows={starBars} />
        </section>
        <section className="panel">
          <h2>Votes</h2>
          <Bars rows={voteBars} />
        </section>
        <section className="panel">
          <h2>Cafes people visit again</h2>
          <Bars rows={returnBars} />
        </section>
        <section className="panel">
          <h2>Who keeps coming back</h2>
          <Bars rows={regulars} />
        </section>
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Latest activity</h2>
        <ul className="ledger">
          {activity.map((item) => (
            <li key={`${item.at}-${item.title}`}>
              <strong>{item.title}</strong>
              {item.detail ? <span>{item.detail}</span> : null}
              <span className="muted">{when(item.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function count<T>(values: T[]) {
  const map = new Map<T, number>()
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return map
}
