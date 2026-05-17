# Supabase Setup

## Prerequisites

- A Supabase project with the URL and anon key set in `.env.local`.
- Email auth enabled (default).

## Applying Migrations

1. Open your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase/migrations/0001_core_mvp.sql` and run it.

Or, if using the Supabase CLI:

```bash
supabase db push
```

## Verifying

After applying the migration, confirm:

- **Tables** `profiles`, `user_preferences`, `saved_movies`, `swipe_history` exist under `public`.
- **RLS** is enabled on all four tables (check the "Authentication" column in Table Editor).
- **Trigger** `on_auth_user_created` exists on `auth.users` (check Database > Triggers).

## Testing RLS

1. Sign up a new user through the app.
2. Check the `profiles` table — a row should exist automatically.
3. Complete onboarding — `user_preferences` should have a row.
4. Save a movie — `saved_movies` should have a row.
5. Try querying another user's rows with the anon key — should return empty.
