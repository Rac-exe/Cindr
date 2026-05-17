export type PreferencePersonRole = "actor" | "director";

export interface PreferencePerson {
  id: number;
  name: string;
  role: PreferencePersonRole;
}

export interface UserPreferences {
  languages: string[];
  genres: number[];
  moods: string[];
  contentTypes: string[];
  yearFrom: number | null;
  yearTo: number | null;
  people: PreferencePerson[];
}

export interface GuestState {
  preferences: UserPreferences;
  onboardingComplete: boolean;
  swipedIds: number[];
  isAdult: boolean;
}

// ── Supabase row types ──────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  is_adult: boolean;
  avatar_public_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedbackCategory = "feedback" | "issue";

export interface FeedbackReport {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  message: string;
  page_path: string | null;
  user_agent: string | null;
  status: "open" | "reviewing" | "closed";
  created_at: string;
}

export interface DbUserPreferences {
  user_id: string;
  languages: string[];
  genres: number[];
  moods: string[];
  content_types: string[];
  year_from: number | null;
  year_to: number | null;
  people: PreferencePerson[];
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export type SavedMovieStatus = "saved" | "favourite" | "watched";

export interface SavedMovie {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  status: SavedMovieStatus | null;
  liked: boolean;
  watchlisted: boolean;
  favourite: boolean;
  watched: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}
