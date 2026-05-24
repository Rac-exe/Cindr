# Swipe Analytics — Manual Test Criteria

## Prerequisites (do these first)

1. Run migrations on Supabase SQL editor **in order**:
   - `supabase/migrations/0013_swipe_stats.sql`
   - `supabase/migrations/0014_swipe_stats_functions.sql`
2. Confirm both tables exist in Supabase Table Editor: `swipe_stats_daily`, `swipe_stats_totals`
3. Confirm `swipe_stats_totals` has exactly one row with id=1 and all counts = 0

---

## Test 1 — Basic swipe recording (left/right)

**Steps:**
1. Open app in browser, go to `/discover`
2. Swipe left on 5 cards
3. Swipe right on 5 cards (total = 10 — should trigger a flush)

**Expected:**
- No visible change in the UI (silent)
- In Supabase `swipe_stats_daily`: a row for today's date appears with `swipes_left=5`, `swipes_right=5`
- In Supabase `swipe_stats_totals`: row 1 shows `swipes_left=5`, `swipes_right=5`

---

## Test 2 — Trailer (up swipe) recording

**Steps:**
1. On the discover page, open any trailer (swipe up or tap Trailer button)

**Expected:**
- `swipes_up` counter increments by 1 on the next flush
- (Flush happens when tab total reaches 10, or when tab is hidden — hide the tab after opening trailer to force a flush)

---

## Test 3 — Flush on tab hide

**Steps:**
1. Swipe 3 times (left or right) — below the 10-swipe flush threshold
2. Switch to a different tab or minimise the browser window

**Expected:**
- Supabase counters update with those 3 swipes
- (Uses `visibilitychange` event)

---

## Test 4 — Flush on tab close (sendBeacon)

**Steps:**
1. Swipe 4 times
2. Close the tab entirely

**Expected:**
- Counts appear in Supabase (may take a few seconds as beacon fires on close)
- If `navigator.sendBeacon` is blocked (some browsers in private mode), fallback fetch fires instead

---

## Test 5 — Active session counting (>3 swipes threshold)

**Steps:**
1. Open a fresh browser tab (clears `sessionStorage`)
2. Swipe exactly 3 times (the 3rd swipe triggers `newSession=true`)

**Expected:**
- `active_sessions` increments by 1 in both tables on the next flush
- Open another fresh tab and do the same — `active_sessions` should be 2 total

**Confirm no double-counting:**
1. In the same tab, swipe 20 more times
2. `active_sessions` should NOT increment again (same session)
3. Refresh the page within same tab, swipe 3 more times
4. `active_sessions` should NOT increment (same `sessionStorage` flag survives refresh)

---

## Test 6 — Guest user (no account)

**Steps:**
1. Open app in Incognito (no account, no login)
2. Swipe 10 times

**Expected:**
- Same as Test 1 — counters increment normally
- No user ID or any identifier in the DB rows — only numeric counts

---

## Test 7 — LocalStorage persistence across refresh

**Steps:**
1. Swipe 7 times (below 10 threshold, no flush yet)
2. Hard-refresh the page (`Ctrl+R`) before switching tabs
3. Swipe 3 more times on the refreshed page

**Expected:**
- On the refresh, the 7 buffered swipes are flushed immediately from `localStorage`
- The 3 new swipes accumulate in the fresh buffer
- Total in DB: original 7 + 3 = 10 (across two separate flushes)

---

## Test 8 — Multiple days (time-series)

**Steps:**
- Not easily testable manually, but verify via SQL:
```sql
SELECT * FROM swipe_stats_daily ORDER BY date DESC;
```
- Should show one row per day with correct counts, not a single row for all time

---

## Test 9 — Totals match sum of daily

**SQL check after all tests:**
```sql
SELECT
  SUM(swipes_left)     AS total_left,
  SUM(swipes_right)    AS total_right,
  SUM(swipes_up)       AS total_up,
  SUM(active_sessions) AS total_sessions
FROM swipe_stats_daily;

SELECT swipes_left, swipes_right, swipes_up, active_sessions
FROM swipe_stats_totals WHERE id = 1;
```
Both queries should return the same numbers.

---

## Test 10 — No app breakage on API failure

**Steps:**
1. Temporarily set an invalid API URL (or disconnect network)
2. Swipe normally

**Expected:**
- The app works completely normally — swipes, cards, recommendations all unaffected
- No error toast or crash
- Counts are silently lost for that session (acceptable)
