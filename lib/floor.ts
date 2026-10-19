import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/server'

export type CafeRow = {
  id: number
  name: string
  rating: number | string | null
  neighborhood: string | null
  vibe: string | null
}

export type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_superadmin?: boolean | null
}

export type VisitRow = {
  id: number
  cafe_id: number
  user_id: string
  visited_at: string
}

export type RatingRow = {
  id: number
  cafe_id: number
  user_id: string
  stars: number
  created_at: string
}

export type CommentRow = {
  id: number
  cafe_id: number
  user_id: string
  body: string
  created_at: string
}

export type VoteRow = {
  id: number
  user_id: string
  value: number
  created_at: string
  comment_id?: number
  caption_id?: number
}

export type SuggestionRow = {
  id: number
  user_id: string | null
  vibes: string[]
  note: string
  cafe_id: number
  reason: string
  outcome: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type FloorData = {
  cafes: CafeRow[]
  profiles: ProfileRow[]
  visits: VisitRow[]
  ratings: RatingRow[]
  comments: CommentRow[]
  commentVotes: VoteRow[]
  suggestions: SuggestionRow[]
  suggestionsError?: string
  error?: string
}

export async function loadFloor(): Promise<FloorData> {
  const access = await requireAdmin()
  if (!access.ok) {
    return empty(access.reason === 'signin' ? 'Sign in first.' : 'Admins only.')
  }

  const supabase = await createClient()
  const [
    cafes,
    profiles,
    visits,
    ratings,
    comments,
    commentVotes,
    suggestions,
  ] = await Promise.all([
    supabase.from('cafe').select('id, name, rating, neighborhood, vibe'),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, is_superadmin'),
    supabase.from('cafe_visits').select('id, cafe_id, user_id, visited_at'),
    supabase
      .from('cafe_ratings')
      .select('id, cafe_id, user_id, stars, created_at'),
    supabase.from('comments').select('id, cafe_id, user_id, body, created_at'),
    supabase
      .from('comment_votes')
      .select('id, comment_id, user_id, value, created_at'),
    supabase
      .from('cafe_suggestions')
      .select('id, user_id, vibes, note, cafe_id, reason, outcome, created_at'),
  ])

  const failure = [
    cafes.error,
    profiles.error,
    visits.error,
    ratings.error,
    comments.error,
    commentVotes.error,
  ].find(Boolean)

  if (failure) {
    return empty(failure.message)
  }

  return {
    cafes: (cafes.data ?? []) as CafeRow[],
    profiles: (profiles.data ?? []) as ProfileRow[],
    visits: (visits.data ?? []) as VisitRow[],
    ratings: (ratings.data ?? []) as RatingRow[],
    comments: (comments.data ?? []) as CommentRow[],
    commentVotes: (commentVotes.data ?? []) as VoteRow[],
    suggestions: suggestions.error
      ? []
      : ((suggestions.data ?? []) as SuggestionRow[]),
    suggestionsError: suggestions.error?.message,
  }
}

function empty(error: string): FloorData {
  return {
    cafes: [],
    profiles: [],
    visits: [],
    ratings: [],
    comments: [],
    commentVotes: [],
    suggestions: [],
    error,
  }
}
