import {
  clearPendingInteractions,
  getGuestState,
  savePreferences as saveGuestPreferences,
  markOnboardingComplete,
} from "@/lib/guest/storage";
import type { TasteProfile } from "@/lib/recommendations/tasteProfile";
import type {
  DbUserPreferences,
  FeedbackCategory,
  FeedbackReport,
  Profile,
  ProfileDashboardData,
  SavedMovie,
  SavedMovieStatus,
  UserPreferences,
} from "@/types/user";

const LOCAL_USER_ID = "local-user";
const LOCAL_PROFILE_KEY = "cindr_local_profile";
const LOCAL_FEEDBACK_KEY = "cindr_local_feedback";
const LOCAL_PREFERENCES_KEY = "cindr_local_preferences";
const LOCAL_SAVED_MOVIES_KEY = "cindr_local_saved_movies";
const LOCAL_TASTE_FINGERPRINT_KEY = "cindr_local_taste_fingerprint";

const EMPTY_PREFERENCES: UserPreferences = {
  languages: [],
  genres: [],
  moods: [],
  contentTypes: [],
  yearFrom: null,
  yearTo: null,
  people: [],
  discoverMode: "taste",
  era: "any",
  runtimePreference: "any",
};

type StoredPreferences = {
  preferences: UserPreferences;
  onboardingComplete: boolean;
  updatedAt: string;
};

type LocalUser = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
};

function nowIso() {
  return new Date().toISOString();
}

function safeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function localUser(): LocalUser {
  return readJson<LocalUser>("cindr_local_user", {
    id: LOCAL_USER_ID,
    email: "local@cindr.app",
    user_metadata: {
      display_name: "Local User",
      is_adult: true,
    },
  });
}

function preferencesToDb(
  stored: StoredPreferences,
  userId = LOCAL_USER_ID
): DbUserPreferences {
  return {
    user_id: userId,
    languages: stored.preferences.languages,
    genres: stored.preferences.genres,
    moods: stored.preferences.moods,
    content_types: stored.preferences.contentTypes,
    year_from: stored.preferences.yearFrom,
    year_to: stored.preferences.yearTo,
    people: stored.preferences.people,
    discover_mode: stored.preferences.discoverMode,
    era: stored.preferences.era,
    runtime_preference: stored.preferences.runtimePreference,
    onboarding_complete: stored.onboardingComplete,
    created_at: stored.updatedAt,
    updated_at: stored.updatedAt,
  };
}

function dbToPreferences(dbPrefs: DbUserPreferences): UserPreferences {
  return {
    languages: dbPrefs.languages ?? [],
    genres: dbPrefs.genres ?? [],
    moods: dbPrefs.moods ?? [],
    contentTypes: dbPrefs.content_types ?? [],
    yearFrom: dbPrefs.year_from ?? null,
    yearTo: dbPrefs.year_to ?? null,
    people: dbPrefs.people ?? [],
    discoverMode: dbPrefs.discover_mode ?? "taste",
    era: dbPrefs.era ?? "any",
    runtimePreference: dbPrefs.runtime_preference ?? "any",
  };
}

function storedPreferences(): StoredPreferences {
  const guest = getGuestState();
  return readJson<StoredPreferences>(LOCAL_PREFERENCES_KEY, {
    preferences: {
      ...EMPTY_PREFERENCES,
      ...guest.preferences,
    },
    onboardingComplete: guest.onboardingComplete,
    updatedAt: nowIso(),
  });
}

function saveStoredPreferences(stored: StoredPreferences) {
  writeJson(LOCAL_PREFERENCES_KEY, stored);
  saveGuestPreferences(stored.preferences);
  if (stored.onboardingComplete) markOnboardingComplete();
}

function calculateIsAdult(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age >= 18;
}

function defaultProfile(): Profile {
  const user = localUser();
  const metadata = user.user_metadata ?? {};
  const createdAt = nowIso();
  const dateOfBirth = (metadata.date_of_birth as string | undefined) ?? null;
  return {
    id: user.id || LOCAL_USER_ID,
    display_name:
      (metadata.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Local User",
    date_of_birth: dateOfBirth,
    is_adult:
      metadata.is_adult === true ||
      metadata.is_adult === "true" ||
      calculateIsAdult(dateOfBirth),
    avatar_public_id: null,
    avatar_url: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function readProfile(): Profile {
  return readJson<Profile>(LOCAL_PROFILE_KEY, defaultProfile());
}

function writeProfile(profile: Profile) {
  writeJson(LOCAL_PROFILE_KEY, { ...profile, updated_at: nowIso() });
}

function readFeedbackReports(): FeedbackReport[] {
  return readJson<FeedbackReport[]>(LOCAL_FEEDBACK_KEY, []);
}

function writeFeedbackReports(reports: FeedbackReport[]) {
  writeJson(LOCAL_FEEDBACK_KEY, reports);
}

function readSavedMovies(): SavedMovie[] {
  return readJson<SavedMovie[]>(LOCAL_SAVED_MOVIES_KEY, []);
}

function writeSavedMovies(movies: SavedMovie[]) {
  writeJson(LOCAL_SAVED_MOVIES_KEY, movies);
}

function sortSavedMovies(movies: SavedMovie[]) {
  return [...movies].sort(
    (a, b) =>
      new Date(b.updated_at ?? b.created_at).getTime() -
      new Date(a.updated_at ?? a.created_at).getTime()
  );
}

export async function getCurrentUserId(): Promise<string | null> {
  return localUser().id || LOCAL_USER_ID;
}

export async function getProfile(): Promise<Profile | null> {
  return readProfile();
}

export async function ensureProfileFromAuth(): Promise<Profile | null> {
  const profile = readProfile();
  writeProfile(profile);
  return profile;
}

export async function updateProfileDateOfBirth(
  dateOfBirth: string
): Promise<Profile | null> {
  const profile = {
    ...readProfile(),
    date_of_birth: dateOfBirth,
    is_adult: calculateIsAdult(dateOfBirth),
  };
  writeProfile(profile);
  return readProfile();
}

export async function updateProfileAvatar(input: {
  avatarPublicId: string | null;
  avatarUrl: string | null;
}): Promise<Profile | null> {
  const profile = {
    ...readProfile(),
    avatar_public_id: input.avatarPublicId,
    avatar_url: input.avatarUrl,
  };
  writeProfile(profile);
  return readProfile();
}

export async function submitFeedbackReport(input: {
  category: FeedbackCategory;
  message: string;
  pagePath?: string | null;
  userAgent?: string | null;
}): Promise<FeedbackReport | null> {
  const report: FeedbackReport = {
    id: safeId("feedback"),
    user_id: LOCAL_USER_ID,
    category: input.category,
    message: input.message.trim(),
    page_path: input.pagePath ?? null,
    user_agent: input.userAgent ?? null,
    status: "open",
    created_at: nowIso(),
  };
  writeFeedbackReports([report, ...readFeedbackReports()]);
  return report;
}

export async function getDbPreferences(): Promise<DbUserPreferences | null> {
  return preferencesToDb(storedPreferences());
}

export async function upsertPreferences(
  prefs: Partial<UserPreferences> & { onboardingComplete?: boolean }
): Promise<void> {
  const current = storedPreferences();
  const next: StoredPreferences = {
    preferences: {
      ...current.preferences,
      ...prefs,
    },
    onboardingComplete:
      prefs.onboardingComplete ?? current.onboardingComplete,
    updatedAt: nowIso(),
  };
  delete (next.preferences as Partial<UserPreferences> & {
    onboardingComplete?: boolean;
  }).onboardingComplete;
  saveStoredPreferences(next);
}

export async function syncGuestToAccount(): Promise<void> {
  const guest = getGuestState();
  const current = storedPreferences();
  const next: StoredPreferences = {
    preferences: {
      ...current.preferences,
      ...guest.preferences,
    },
    onboardingComplete: current.onboardingComplete || guest.onboardingComplete,
    updatedAt: nowIso(),
  };
  saveStoredPreferences(next);

  for (const interaction of guest.pendingInteractions) {
    await patchMovieInteraction(
      {
        tmdb_id: interaction.tmdb_id,
        media_type: interaction.media_type,
        title: interaction.title,
        poster_path: interaction.poster_path,
      },
      interaction.patch
    );
  }
  clearPendingInteractions();
  await ensureProfileFromAuth();
}

export async function getEffectivePreferences(): Promise<{
  preferences: UserPreferences;
  onboardingComplete: boolean;
}> {
  const stored = storedPreferences();
  return {
    preferences: {
      ...EMPTY_PREFERENCES,
      ...stored.preferences,
    },
    onboardingComplete: stored.onboardingComplete,
  };
}

export async function getProfileDashboardData(): Promise<ProfileDashboardData | null> {
  const profile = readProfile();
  const prefs = dbToPreferences(preferencesToDb(storedPreferences()));
  const movies = readSavedMovies();
  const reports = readFeedbackReports();

  return {
    identity: {
      displayName: profile.display_name ?? "Local User",
      email: localUser().email ?? null,
      avatarUrl: profile.avatar_url ?? null,
      dateOfBirth: profile.date_of_birth ?? null,
    },
    taste: {
      languages: prefs.languages,
      contentTypes: prefs.contentTypes,
      moods: prefs.moods,
      genres: prefs.genres,
      yearFrom: prefs.yearFrom,
      yearTo: prefs.yearTo,
      peopleCount: prefs.people.length,
      discoverMode: prefs.discoverMode,
    },
    library: {
      liked: movies.filter((movie) => movie.liked).length,
      watchlisted: movies.filter((movie) => movie.watchlisted).length,
      favourite: movies.filter((movie) => movie.favourite).length,
      watched: movies.filter((movie) => movie.watched).length,
      rated: movies.filter((movie) => movie.rating !== null).length,
    },
    support: {
      feedbackReports: reports.length,
      openReports: reports.filter((report) => report.status === "open").length,
    },
  };
}

type MovieInteractionInput = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
};

type MovieInteractionPatch = Partial<
  Pick<
    SavedMovie,
    "liked" | "watchlisted" | "favourite" | "watched" | "rating"
  >
>;

function findSavedMovie(
  movies: SavedMovie[],
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  return movies.find(
    (movie) => movie.tmdb_id === tmdbId && movie.media_type === mediaType
  );
}

function upsertSavedMovie(
  movie: MovieInteractionInput,
  patch: MovieInteractionPatch & { status?: SavedMovieStatus | null }
): SavedMovie {
  const movies = readSavedMovies();
  const existing = findSavedMovie(movies, movie.tmdb_id, movie.media_type);
  const timestamp = nowIso();
  const next: SavedMovie = {
    id: existing?.id ?? safeId("movie"),
    user_id: LOCAL_USER_ID,
    tmdb_id: movie.tmdb_id,
    media_type: movie.media_type,
    title: movie.title,
    poster_path: movie.poster_path,
    status: patch.status ?? existing?.status ?? null,
    liked: patch.liked ?? existing?.liked ?? false,
    watchlisted: patch.watchlisted ?? existing?.watchlisted ?? false,
    favourite: patch.favourite ?? existing?.favourite ?? false,
    watched: patch.watched ?? existing?.watched ?? false,
    rating: patch.rating !== undefined ? patch.rating : existing?.rating ?? null,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
  };

  writeSavedMovies(
    existing
      ? movies.map((item) => (item.id === existing.id ? next : item))
      : [next, ...movies]
  );
  return next;
}

export async function saveMovie(movie: {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  status?: SavedMovieStatus;
}): Promise<SavedMovie | null> {
  return upsertSavedMovie(movie, {
    status: movie.status ?? "saved",
    watchlisted: true,
  });
}

export async function likeMovie(
  movie: MovieInteractionInput
): Promise<SavedMovie | null> {
  return upsertSavedMovie(movie, { liked: true });
}

export async function rateMovie(
  movie: MovieInteractionInput & { rating: number }
): Promise<SavedMovie | null> {
  const rating = Math.max(1, Math.min(10, Math.round(movie.rating)));
  return upsertSavedMovie(movie, { rating });
}

export async function updateSavedMovieRating(
  id: string,
  rating: number
): Promise<void> {
  const movies = readSavedMovies();
  const nextRating = Math.max(1, Math.min(10, Math.round(rating)));
  writeSavedMovies(
    movies.map((movie) =>
      movie.id === id
        ? { ...movie, rating: nextRating, updated_at: nowIso() }
        : movie
    )
  );
}

export async function getSavedMovieForTitle(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<SavedMovie | null> {
  return findSavedMovie(readSavedMovies(), tmdbId, mediaType) ?? null;
}

export async function patchMovieInteraction(
  movie: MovieInteractionInput,
  patch: MovieInteractionPatch
): Promise<SavedMovie | null> {
  return upsertSavedMovie(movie, patch);
}

export async function patchSavedMovieById(
  id: string,
  patch: MovieInteractionPatch
): Promise<void> {
  const movies = readSavedMovies();
  writeSavedMovies(
    movies.map((movie) =>
      movie.id === id ? { ...movie, ...patch, updated_at: nowIso() } : movie
    )
  );
}

export async function updateSavedMovieStatus(
  id: string,
  status: SavedMovieStatus
): Promise<void> {
  const flagPatch =
    status === "saved"
      ? { status, watchlisted: true }
      : status === "favourite"
      ? { status, favourite: true }
      : { status, watched: true, watchlisted: false };
  await patchSavedMovieById(id, flagPatch);
}

export async function removeSavedMovie(id: string): Promise<void> {
  writeSavedMovies(readSavedMovies().filter((movie) => movie.id !== id));
}

export async function getSavedMovies(): Promise<SavedMovie[]> {
  return sortSavedMovies(readSavedMovies());
}

export async function saveTasteFingerprint(profile: TasteProfile): Promise<void> {
  writeJson(LOCAL_TASTE_FINGERPRINT_KEY, profile);
}

export async function loadTasteFingerprint(): Promise<TasteProfile | null> {
  return readJson<TasteProfile | null>(LOCAL_TASTE_FINGERPRINT_KEY, null);
}

export async function getLikedTmdbIds(): Promise<number[]> {
  return readSavedMovies()
    .filter((movie) => movie.liked)
    .map((movie) => movie.tmdb_id);
}
