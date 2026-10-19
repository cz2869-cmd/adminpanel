import SuggestionManager from '@/app/components/suggestion-manager'
import { loadFloor } from '@/lib/floor'

export const dynamic = 'force-dynamic'

export default async function SuggestionsPage() {
  const floor = await loadFloor()
  if (floor.error) {
    return <p className="error">{floor.error}</p>
  }

  return (
    <>
      <header className="hero">
        <div>
          <p className="eyebrow">Need a nudge</p>
          <h1>Cafe suggestions</h1>
        </div>
        <p className="muted">
          Suggestions from Morningside Nook show up here on their own. Create,
          update, or delete any of those records from this page.
        </p>
      </header>
      {floor.suggestionsError ? (
        <p className="error">
          Suggestions are not in the database yet. Run supabase/suggestions.sql
          in the Supabase SQL editor.
        </p>
      ) : (
        <SuggestionManager
          cafes={floor.cafes}
          profiles={floor.profiles}
          suggestions={floor.suggestions}
        />
      )}
    </>
  )
}
