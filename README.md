# Cindr

> Find your perfect match. Movie edition.

Cindr is a cinematic movie and series discovery app built around a simple behavior: swipe through one great recommendation at a time, open the trailer when something hits, then save, rate, share, or move on.

It combines TMDB discovery data, Supabase auth and persistence, Cloudinary profile images, and a mobile-first Next.js interface to make movie discovery feel fast, personal, and fun.

## Why It Exists

Streaming catalogs are huge. Deciding what to watch should not feel like work.

Cindr turns discovery into a focused flow:

- Pick your languages, genres, moods, content types, eras, years, actors, and directors.
- Swipe through movies, TV series, anime, and documentaries.
- Swipe right to open the trailer and capture the title as liked.
- Save titles to a watchlist, mark favorites, mark watched, and rate from 1-10.
- Share a clean public movie page with Open Graph metadata.

## Product Highlights

- Swipe-first discovery deck with animated cards, keyboard support, undo, and reshuffling.
- Personal onboarding with quick quiz mode and advanced filters.
- TMDB-backed discovery for movies, TV series, anime, and documentaries.
- Trailer dialog with official YouTube trailers when TMDB provides them.
- Watch providers surfaced for India first, with US fallback.
- Supabase email/password auth with guest preference syncing after login/signup.
- Per-user preferences, profile data, saved titles, list flags, ratings, and feedback reports.
- Watchlist views for liked, watchlisted, favourite, and watched titles.
- Shareable movie and TV pages at `/m/[type]/[id]`.
- Cloudinary-backed profile avatars with signed uploads.
- Feedback / issue report modal for signed-in users.
- Cinematic dark UI with Cindr orange accents, motion, and mobile navigation.

## Screenshots

No screenshots are currently checked into the repo. Suggested captures once the app is running:

- Landing page: `/`
- Preference onboarding: `/onboarding?mode=quiz` and `/onboarding?mode=advanced`
- Swipe deck: `/discover`
- Trailer/details modal after a right swipe
- Watchlist: `/watchlist`
- Shared title page: `/m/movie/[tmdb_id]`

Place exported images under `public/screenshots/` and reference them here when available.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **UI:** React 19, TypeScript, Tailwind CSS 4
- **Motion:** Framer Motion
- **Icons:** Phosphor Icons
- **Auth and database:** Supabase
- **Movie data:** TMDB API
- **Profile media:** Cloudinary signed uploads
- **Linting:** ESLint 9 with `eslint-config-next`

## Getting Started

### Prerequisites

- Node.js compatible with Next.js 16
- npm
- A TMDB API key or TMDB v4 read access token
- A Supabase project
- A Cloudinary account if profile avatar uploads are needed

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Local Environment

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

Keep `.env.local` private. Do not commit secrets.

### 3. Configure Environment Variables

The app reads the following variables from `.env.local`:

- `TMDB_READ_ACCESS_TOKEN` - TMDB v4 read token. Preferred when available.
- `TMDB_API_KEY` - TMDB v3 API key. Used if no read token is set.
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key.
- `NEXT_PUBLIC_APP_URL` - Local or deployed app origin. Defaults to `http://localhost:3000` in the example.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name.
- `NEXT_PUBLIC_CLOUDINARY_API_KEY` - Cloudinary API key.
- `CLOUDINARY_API_SECRET` - Cloudinary API secret. Server-only. Never expose it client-side.
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER` - Optional upload folder. Example: `cindr/profiles`.

TMDB auth requires one of `TMDB_READ_ACCESS_TOKEN` or `TMDB_API_KEY`.

## Supabase Setup

Cindr uses Supabase for auth, profiles, preferences, saved movie interactions, ratings, avatars, and feedback reports.

1. Create a Supabase project.
2. Enable email/password authentication in Supabase Auth.
3. Copy the project URL and anon key into `.env.local`.
4. Apply every migration in `supabase/migrations/` in order.

Current migrations:

- `0001_core_mvp.sql` - profiles, user preferences, saved movies, and initial RLS policies.
- `0002_ratings_and_likes.sql` - liked flag, rating support, and simplified swipe persistence.
- `0003_profile_self_insert.sql` - lets users repair or create their own profile row.
- `0004_saved_movie_flags.sql` - independent watchlisted, favourite, and watched flags.
- `0005_advanced_preferences.sql` - year range and people preferences.
- `0006_profile_avatar.sql` - Cloudinary avatar fields on profiles.
- `0007_feedback_reports.sql` - feedback and issue report table with RLS.

You can apply them through the Supabase SQL Editor. If you use the Supabase CLI in your workflow, apply the same migrations from the `supabase/migrations/` directory.

All application tables use row level security with user-scoped policies.

## TMDB Setup

Cindr routes all TMDB calls through Next.js API routes so API credentials stay server-side.

- `/api/tmdb/discover` builds discovery queries from user preferences.
- `/api/tmdb/movie/[id]` fetches movie or TV details with videos and watch providers.
- `/api/tmdb/search-person` searches actors and directors for advanced preferences.

Get credentials from [TMDB](https://www.themoviedb.org/settings/api), then add either:

```bash
TMDB_READ_ACCESS_TOKEN=your_tmdb_v4_read_access_token_here
```

or:

```bash
TMDB_API_KEY=your_tmdb_v3_api_key_here
```

This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.

## Cloudinary Setup

Profile photos use a signed upload flow:

1. The signed-in client calls `/api/cloudinary/sign-profile-upload`.
2. The server validates the Supabase session.
3. The server signs Cloudinary upload parameters with `CLOUDINARY_API_SECRET`.
4. The browser uploads directly to Cloudinary.
5. The app stores `avatar_public_id` and `avatar_url` on the user's Supabase profile.

Required Cloudinary variables:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER=cindr/profiles
```

The app does not require an unsigned upload preset.

## Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Smoke Test Checklist

After setting up Supabase, TMDB, and Cloudinary, run through this flow:

- Open `/` and confirm the landing page loads.
- Start onboarding and save language/content preferences.
- Use advanced onboarding to search for an actor or director.
- Open `/discover` and confirm cards load from TMDB.
- Swipe left and right; verify right swipe opens the trailer/details modal.
- Save, favourite, mark watched, like, and rate a title while signed in.
- Open `/watchlist` and confirm the title appears under the expected tabs.
- Use share from the modal or watchlist and confirm the generated `/m/[type]/[id]` page loads.
- Upload and remove a profile photo from `/profile`.
- Submit feedback or an issue from the landing/profile menu.
- Run `npm run lint` before handing off changes.

## Project Structure

```text
app/
  api/
    cloudinary/sign-profile-upload/  Signed avatar upload endpoint
    tmdb/discover/                   Preference-aware discovery endpoint
    tmdb/movie/[id]/                 Movie and TV details endpoint
    tmdb/search-person/              Actor/director search endpoint
  auth/                              Login and signup screens
  discover/                          Swipe deck experience
  m/[type]/[id]/                     Shareable movie and TV pages
  onboarding/                        Quiz and advanced preferences
  profile/                           Profile, DOB, avatar, preferences
  watchlist/                         Liked/watchlist/favourite/watched views

components/
  discover/                          Swipe deck, actions, trailer dialog
  layout/                            App chrome, mobile nav, cinematic backdrop

lib/
  cloudinary/                        Avatar URL helpers
  constants/                         Genres, languages, quiz mappings
  guest/                             Guest localStorage persistence
  recommendations/                   TMDB discover query builders
  supabase/                          Supabase client and data helpers
  tmdb/                              TMDB fetch client

supabase/migrations/                 Database schema and RLS migrations
types/                               Shared movie and user types
```

## Data Model Overview

Supabase currently stores:

- `profiles` - display name, date of birth, adult flag, Cloudinary avatar metadata.
- `user_preferences` - languages, genres, moods, content types, year range, people filters, onboarding state.
- `saved_movies` - TMDB id, media type, title, poster, liked/watchlisted/favourite/watched flags, and rating.
- `feedback_reports` - signed-in user feedback and issue reports.

Guest users keep preferences and swiped IDs in localStorage. When they sign up or log in, preferences sync into Supabase.

## Product Roadmap

Near-term opportunities:

- Add checked-in product screenshots and/or a short demo clip.
- Add automated tests around TMDB query generation and Supabase interaction helpers.
- Add richer recommendation ranking from saved likes, ratings, and watched history.
- Add social lists or collaborative watch planning.
- Add admin tooling for feedback report triage.
- Add deployment documentation once the production target is chosen.

## Notes For Maintainers

- Keep `.env.local.example` in sync with the variables listed above.
- Keep Supabase migrations additive and ordered.
- Do not expose TMDB credentials or Cloudinary API secrets to the browser.
- Prefer server-side TMDB access through `lib/tmdb/client.ts` and the existing API routes.
- Run `npm run lint` before opening a PR or shipping a handoff.

