import { cafeName, personName, when } from '@/lib/format'
import { loadFloor } from '@/lib/floor'

export const dynamic = 'force-dynamic'

export default async function VotesPage() {
  const floor = await loadFloor()
  if (floor.error) {
    return <p className="error">{floor.error}</p>
  }

  const cafeById = new Map(floor.cafes.map((cafe) => [cafe.id, cafe]))
  const profileById = new Map(floor.profiles.map((profile) => [profile.id, profile]))
  const commentById = new Map(floor.comments.map((comment) => [comment.id, comment]))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read only</p>
          <h1>Votes and ratings</h1>
        </div>
        <p className="muted">Upvotes, downvotes, and star ratings.</p>
      </header>
      <div className="stack">
        <section className="panel tableWrap">
          <h2>Comment votes</h2>
          <VoteTable
            rows={[...floor.commentVotes]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((vote) => {
              const comment = vote.comment_id
                ? commentById.get(vote.comment_id)
                : undefined
              return {
                id: vote.id,
                when: when(vote.created_at),
                who: personName(profileById.get(vote.user_id) ?? null),
                vote: vote.value > 0 ? 'Up' : 'Down',
                subject: comment?.body ?? 'Missing comment',
                where: cafeName(
                  cafeById.get(comment?.cafe_id ?? -1)?.name ?? 'Unknown cafe'
                ),
              }
            })}
          />
        </section>
        <section className="panel tableWrap">
          <h2>Cafe ratings</h2>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Stars</th>
                <th>Cafe</th>
              </tr>
            </thead>
            <tbody>
              {floor.ratings
                .slice()
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((rating) => (
                  <tr key={rating.id}>
                    <td>{when(rating.created_at)}</td>
                    <td>{personName(profileById.get(rating.user_id) ?? null)}</td>
                    <td>{'★'.repeat(rating.stars)}</td>
                    <td>
                      {cafeName(
                        cafeById.get(rating.cafe_id)?.name ?? 'Unknown cafe'
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  )
}

function VoteTable({
  rows,
}: {
  rows: {
    id: number
    when: string
    who: string
    vote: string
    subject: string
    where: string
  }[]
}) {
  if (rows.length === 0) {
    return <p className="empty">No votes yet.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>When</th>
          <th>Who</th>
          <th>Vote</th>
          <th>On</th>
          <th>Cafe</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.when}</td>
            <td>{row.who}</td>
            <td>{row.vote}</td>
            <td>{row.subject}</td>
            <td>{row.where}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
