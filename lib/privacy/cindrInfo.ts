export const aboutSections = [
  {
    title: "What Cindr Does",
    detail:
      "Cindr is a swipe-first discovery app for finding movies and shows faster, then saving what looks worth watching.",
  },
  {
    title: "How Recommendations Work",
    detail:
      "The current version is rule-based: preferences and hard filters shape the candidate set, then Cindr shuffles or ranks the deck depending on the selected mode.",
  },
  {
    title: "Privacy Model",
    detail:
      "Cindr keeps recommendation inputs queryable instead of encrypting everything. Supabase RLS is the main protection boundary for private user rows.",
  },
  {
    title: "TMDB Attribution",
    detail:
      "Movie and TV metadata comes from TMDB. Cindr is not endorsed or certified by TMDB.",
  },
] as const;

export const helpSections = [
  {
    title: "Swiping",
    detail:
      "Swipe right or use the cinema button to like a pick and open its trailer card. Swipe left to skip. Undo brings back your last swipe.",
  },
  {
    title: "Taste vs Random",
    detail:
      "Taste uses your saved preferences. Random ignores taste signals and rolls broader batches, while still respecting explicit hard filters like years, genres, and people.",
  },
  {
    title: "Filters",
    detail:
      "Refresh taste profile changes languages, moods, and content types. Advanced filters are stronger controls for year ranges, genres, actors, and directors.",
  },
  {
    title: "Watchlist",
    detail:
      "The trailer card lets you toggle watchlist, favourite, watched, liked, and rating separately. Watchlist cards reopen the full trailer/details view.",
  },
  {
    title: "Trailer Issues",
    detail:
      "Cindr checks its trailer registry first, then resolves an official trailer fallback. Use feedback if a trailer is missing or wrong.",
  },
] as const;

export const creatorSections = [
  {
    title: "Built by Prabhat",
    detail:
      "Cindr is built by Prabhat Bajpai as a personal take on movie discovery: less searching, less noise, and more of the feeling of finding something that actually fits the night.",
  },
  {
    title: "Why It Exists",
    detail:
      "The inspiration is simple: people waste too much time choosing what to watch. Cindr treats discovery like a quick, cinematic swipe flow, then slowly turns your likes, favourites, watch history, and ratings into a taste profile.",
  },
] as const;
