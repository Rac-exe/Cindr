import {
  clearPendingInteractions,
  getGuestState,
} from "@/lib/guest/storage";
import { supabase } from "./client";
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

const ERA_VALUES = ["new", "modern", "classic"] as const;
const RUNTIME_VALUES = ["short", "medium", "long", "mini"] as const;
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

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function ensureProfileFromAuth(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await getProfile();
  const metadata = user.user_metadata ?? {};
  const dateOfBirth =
    (metadata.date_of_birth as string | undefined) ??
    existing?.date_of_birth ??
    null;
  const isAdult =
    calculateIsAdult(dateOfBirth) ||
    metadata.is_adult === true ||
    metadata.is_adult === "true";
  const displayName =
    (metadata.display_name as string | undefined) ??
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    existing?.display_name ??
    user.email?.split("@")[0] ??
    null;
  const avatarUrl =
    existing?.avatar_url ??
    (metadata.avatar_url as string | undefined) ??
    (metadata.picture as string | undefined) ??
    null;

  const row = {
    id: user.id,
    display_name: displayName,
    date_of_birth: dateOfBirth,
    is_adult: isAdult,
    avatar_url: avatarUrl,
    avatar_public_id: existing?.avatar_public_id ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return (data as Profile) ?? existing ?? null;
}

export async function updateProfileDateOfBirth(
  dateOfBirth: string
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const isAdult = calculateIsAdult(dateOfBirth);
  await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      date_of_birth: dateOfBirth,
      is_adult: isAdult,
    },
  });

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name:
          (user.user_metadata?.display_name as string | undefined) ??
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          user.email?.split("@")[0] ??
          null,
        date_of_birth: dateOfBirth,
        is_adult: isAdult,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfileAvatar(input: {
  avatarPublicId: string | null;
  avatarUrl: string | null;
}): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      avatar_public_id: input.avatarPublicId,
      avatar_url: input.avatarUrl,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function submitFeedbackReport(input: {
  category: FeedbackCategory;
  message: string;
  pagePath?: string | null;
  userAgent?: string | null;
}): Promise<FeedbackReport | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("feedback_reports")
    .insert({
      user_id: userId,
      category: input.category,
      message: input.message.trim(),
      page_path: input.pagePath ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return (data as FeedbackReport) ?? null;
}

export async function getDbPreferences(): Promise<DbUserPreferences | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as DbUserPreferences | null) ?? null;
}

export async function upsertPreferences(
  prefs: Partial<UserPreferences> & { onboardingComplete?: boolean }
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const row: Record<string, unknown> = { user_id: userId };
  if (prefs.languages) row.languages = prefs.languages;
  if (prefs.genres) row.genres = prefs.genres;
  if (prefs.moods) row.moods = prefs.moods;
  if (prefs.contentTypes) row.content_types = prefs.contentTypes;
  if (prefs.yearFrom !== undefined) row.year_from = prefs.yearFrom;
  if (prefs.yearTo !== undefined) row.year_to = prefs.yearTo;
  if (prefs.people) row.people = prefs.people;
  if (prefs.discoverMode) row.discover_mode = prefs.discoverMode;
  if (prefs.era) row.era = prefs.era;
  if (prefs.runtimePreference) row.runtime_preference = prefs.runtimePreference;
  if (prefs.onboardingComplete !== undefined) {
    row.onboarding_complete = prefs.onboardingComplete;
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(row, { onConflict: "user_id" });

  if (error) throw error;
}

function hasMeaningfulGuestPreferences(prefs: UserPreferences): boolean {
  return (
    prefs.languages.length > 0 ||
    prefs.genres.length > 0 ||
    prefs.moods.length > 0 ||
    prefs.contentTypes.length > 0 ||
    Boolean(prefs.yearFrom) ||
    Boolean(prefs.yearTo) ||
    prefs.people.length > 0 ||
    prefs.discoverMode !== "taste" ||
    prefs.era !== "any" ||
    prefs.runtimePreference !== "any"
  );
}

export async function syncGuestToAccount(): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const guest = getGuestState();
  const existingPrefs = await getDbPreferences();
  const shouldSyncGuestPreferences =
    hasMeaningfulGuestPreferences(guest.preferences) &&
    (!existingPrefs || !existingPrefs.onboarding_complete);

  if (shouldSyncGuestPreferences) {
    await upsertPreferences({
      ...guest.preferences,
      onboardingComplete: guest.onboardingComplete,
    });
  }

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
  const guest = getGuestState();
  const userId = await getCurrentUserId();
  if (!userId) {
    return {
      preferences: guest.preferences,
      onboardingComplete: guest.onboardingComplete,
    };
  }

  const dbPrefs = await getDbPreferences();
  if (!dbPrefs) {
    return {
      preferences: EMPTY_PREFERENCES,
      onboardingComplete: false,
    };
  }

  const rawMoods = dbPrefs.moods ?? [];
  const legacyEra = rawMoods.find((mood) =>
    ERA_VALUES.includes(mood as (typeof ERA_VALUES)[number])
  );
  const legacyRuntime = rawMoods.find((mood) =>
    RUNTIME_VALUES.includes(mood as (typeof RUNTIME_VALUES)[number])
  );

  return {
    preferences: dbToPreferences({
      ...dbPrefs,
      moods: rawMoods.filter(
        (mood) =>
          !ERA_VALUES.includes(mood as (typeof ERA_VALUES)[number]) &&
          !RUNTIME_VALUES.includes(mood as (typeof RUNTIME_VALUES)[number])
      ),
      era: dbPrefs.era ?? legacyEra ?? "any",
      runtime_preference:
        dbPrefs.runtime_preference ??
        (legacyRuntime === "mini" ? "short" : legacyRuntime) ??
        "any",
    }),
    onboardingComplete: dbPrefs.onboarding_complete,
  };
}

export async function getProfileDashboardData(): Promise<ProfileDashboardData | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profile, preferences, savedMovies, feedbackReports] = await Promise.all([
    ensureProfileFromAuth(),
    getDbPreferences(),
    supabase.from("saved_movies").select("*").eq("user_id", userId),
    supabase.from("feedback_reports").select("*").eq("user_id", userId),
  ]);
  const prefs = preferences ? dbToPreferences(preferences) : EMPTY_PREFERENCES;
  const movies = (savedMovies.data as SavedMovie[] | null) ?? [];
  const reports = (feedbackReports.data as FeedbackReport[] | null) ?? [];
  const displayName =
    profile?.display_name ??
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";

  return {
    identity: {
      displayName,
      email: user?.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      dateOfBirth: profile?.date_of_birth ?? null,
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
    "liked" | "favourite" | "watched" | "rating"
  >
>;

async function getExistingSavedMovie(
  userId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<SavedMovie | null> {
  const { data, error } = await supabase
    .from("saved_movies")
    .select("*")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) throw error;
  return (data as SavedMovie | null) ?? null;
}

export async function saveMovie(movie: {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  status?: SavedMovieStatus;
}): Promise<SavedMovie | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await getExistingSavedMovie(
    userId,
    movie.tmdb_id,
    movie.media_type
  );
  const row = {
    user_id: userId,
    tmdb_id: movie.tmdb_id,
    media_type: movie.media_type,
    title: movie.title,
    poster_path: movie.poster_path,
    status: movie.status ?? "saved",
  };

  const query = existing
    ? supabase.from("saved_movies").update(row).eq("id", existing.id)
    : supabase.from("saved_movies").insert(row);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return (data as SavedMovie) ?? null;
}

export async function likeMovie(
  movie: MovieInteractionInput
): Promise<SavedMovie | null> {
  return patchMovieInteraction(movie, { liked: true });
}

export async function rateMovie(
  movie: MovieInteractionInput & { rating: number }
): Promise<SavedMovie | null> {
  const rating = Math.max(1, Math.min(10, Math.round(movie.rating)));
  return patchMovieInteraction(movie, { rating });
}

export async function updateSavedMovieRating(
  id: string,
  rating: number
): Promise<void> {
  const nextRating = Math.max(1, Math.min(10, Math.round(rating)));
  const { error } = await supabase
    .from("saved_movies")
    .update({ rating: nextRating })
    .eq("id", id);
  if (error) throw error;
}

export async function getSavedMovieForTitle(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<SavedMovie | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return getExistingSavedMovie(userId, tmdbId, mediaType);
}

export async function patchMovieInteraction(
  movie: MovieInteractionInput,
  patch: MovieInteractionPatch
): Promise<SavedMovie | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const existing = await getExistingSavedMovie(
    userId,
    movie.tmdb_id,
    movie.media_type
  );
  const row = {
    user_id: userId,
    tmdb_id: movie.tmdb_id,
    media_type: movie.media_type,
    title: movie.title,
    poster_path: movie.poster_path,
    ...patch,
  };

  const query = existing
    ? supabase.from("saved_movies").update(row).eq("id", existing.id)
    : supabase
        .from("saved_movies")
        .insert({ ...row, status: null as SavedMovieStatus | null });

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return (data as SavedMovie) ?? null;
}

export async function patchSavedMovieById(
  id: string,
  patch: MovieInteractionPatch
): Promise<void> {
  const { error } = await supabase
    .from("saved_movies")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function updateSavedMovieStatus(
  id: string,
  status: SavedMovieStatus
): Promise<void> {
  const flagPatch =
    status === "saved"
      ? { status }
      : status === "favourite"
      ? { status, favourite: true }
      : { status, watched: true };
  const { error } = await supabase
    .from("saved_movies")
    .update(flagPatch)
    .eq("id", id);
  if (error) throw error;
}

export async function removeSavedMovie(id: string): Promise<void> {
  const { error } = await supabase.from("saved_movies").delete().eq("id", id);
  if (error) throw error;
}

export async function getSavedMovies(): Promise<SavedMovie[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("saved_movies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as SavedMovie[] | null) ?? [];
}

export async function saveTasteFingerprint(profile: TasteProfile): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase.from("taste_fingerprints").upsert(
    {
      user_id: userId,
      fingerprint: profile,
      swipe_count: profile.swipeCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function loadTasteFingerprint(): Promise<TasteProfile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("taste_fingerprints")
    .select("fingerprint")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.fingerprint as TasteProfile | null) ?? null;
}

export async function getLikedTmdbIds(): Promise<number[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("saved_movies")
    .select("tmdb_id")
    .eq("user_id", userId)
    .eq("liked", true);

  if (error) throw error;
  return ((data as { tmdb_id: number }[] | null) ?? []).map(
    (row) => row.tmdb_id
  );
}
