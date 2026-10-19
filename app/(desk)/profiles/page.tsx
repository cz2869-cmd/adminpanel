import { personName } from '@/lib/format'
import { loadFloor } from '@/lib/floor'

export const dynamic = 'force-dynamic'

export default async function ProfilesPage() {
  const floor = await loadFloor()
  if (floor.error) {
    return <p className="error">{floor.error}</p>
  }

  const visits = count(floor.visits.map((row) => row.user_id))
  const notes = count(floor.comments.map((row) => row.user_id))
  const ratings = count(floor.ratings.map((row) => row.user_id))

  const rows = floor.profiles
    .slice()
    .sort((a, b) => personName(a).localeCompare(personName(b)))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read only</p>
          <h1>Profiles</h1>
        </div>
        <p className="muted">{rows.length} people have a row in the database.</p>
      </header>
      <section className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Profile</th>
              <th>Visits</th>
              <th>Notes</th>
              <th>Ratings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <div className="person">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" />
                    ) : (
                      <span className="avatarFallback">
                        {personName(profile).slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <strong>{personName(profile)}</strong>
                      {profile.is_superadmin ? (
                        <span className="badge">Superadmin</span>
                      ) : null}
                      <div className="muted">{profile.id}</div>
                    </div>
                  </div>
                </td>
                <td>{visits.get(profile.id) ?? 0}</td>
                <td>{notes.get(profile.id) ?? 0}</td>
                <td>{ratings.get(profile.id) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

function count(values: string[]) {
  const map = new Map<string, number>()
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return map
}
