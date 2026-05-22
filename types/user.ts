export type PreferencePersonRole = "actor" | "director";
export type DiscoverMode = "taste" | "random";
export type EraPreference = "new" | "modern" | "classic" | "any";
export type RuntimePreference = "short" | "medium" | "long" | "any";

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
  discoverMode: DiscoverMode;
  era: EraPreference;
  runtimePreference: RuntimePreference;
}

export interface PendingGuestInteraction {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  patch: Partial<
    Pick<SavedMovie, "liked" | "watchlisted" | "favourite" | "watched" | "rating">
  >;
}

export interface GuestState {
  preferences: UserPreferences;
  preferencesUpdatedAt: string | null;
  onboardingComplete: boolean;
  swipedIds: number[];
  pendingInteractions: PendingGuestInteraction[];
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
  user_id: string | null;
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
  discover_mode: DiscoverMode;
  era: EraPreference;
  runtime_preference: RuntimePreference;
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

export interface ProfileDashboardData {
  identity: {
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
    dateOfBirth: string | null;
  };
  taste: {
    languages: string[];
    contentTypes: string[];
    moods: string[];
    genres: number[];
    yearFrom: number | null;
    yearTo: number | null;
    peopleCount: number;
    discoverMode: DiscoverMode;
  };
  library: {
    liked: number;
    watchlisted: number;
    favourite: number;
    watched: number;
    rated: number;
  };
  support: {
    feedbackReports: number;
    openReports: number;
  };
}
