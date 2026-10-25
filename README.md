# Nook Desk

Admin area for the Morningside Nook Supabase project.

Every desk route requires a Google session. The server then checks `profiles.is_superadmin`. To grant an account that field, run the update in `supabase/admin.sql` in the Supabase SQL editor with that Google email. Run `supabase/suggestions.sql` there too so Need a nudge suggestions are saved. Run `supabase/llm-admin.sql` after those two so the desk can read prompt chains, models, generation logs, terms, and the signup allow lists.

Copy `.env.example` to `.env.local` and use the same Supabase URL and publishable key as Morningside Nook. Add this app's `/auth/callback` URL to the Supabase Google redirect allow list.
