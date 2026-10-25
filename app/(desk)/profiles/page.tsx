import { personName, when } from '@/lib/format'
import { loadFloor } from '@/lib/floor'
import { explainQuery } from '@/lib/manage'
import { createClient } from '@/lib/server'

export const dynamic = 'force-dynamic'

type ListedUser = {
  id: string
  email: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_superadmin: boolean
}

export default async function ProfilesPage() {
  const floor = await loadFloor()
  if (floor.error) {
    return <p className="error">{floor.error}</p>
  }

  const supabase = await createClient()
  const listed = await supabase.rpc('admin_list_users')
  const users = (listed.data ?? []) as ListedUser[]
  const userError = listed.error ? explainQuery(listed.error.message) : null

  const visits = count(floor.visits.map((row) => row.user_id))
  const notes = count(floor.comments.map((row) => row.user_id))
  const ratings = count(floor.ratings.map((row) => row.user_id))

  const rows = (users.length
    ? users
    : floor.profiles.map((profile) => ({
        ...profile,
        email: null,
        created_at: '',
      }))
  )
    .slice()
    .sort((a, b) => personName(a).localeCompare(personName(b)))

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Read users</p>
          <h1>Users</h1>
        </div>
        <p className="muted">{rows.length} accounts can sign in.</p>
      </header>
      {userError ? <p className="error">{userError}</p> : null}
      <section className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Joined</th>
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
                    </div>
                  </div>
                </td>
                <td>{profile.email ?? '—'}</td>
                <td>{profile.created_at ? when(profile.created_at) : '—'}</td>
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
