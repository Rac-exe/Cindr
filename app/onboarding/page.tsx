"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LANGUAGES, MAX_LANGUAGES } from "@/lib/constants/languages";
import { CONTENT_TYPES, getQuestionsForTypes } from "@/lib/constants/quiz";
import { TMDB_GENRES } from "@/lib/constants/tmdbGenres";
import type { QuizQuestion } from "@/lib/constants/quiz";
import { savePreferences, markOnboardingComplete } from "@/lib/guest/storage";
import {
  upsertPreferences,
  getCurrentUserId,
  getEffectivePreferences,
} from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import AppHeader from "@/components/layout/AppHeader";
import OnboardingIntro from "@/components/onboarding/OnboardingIntro";
import type {
  EraPreference,
  PreferencePerson,
  PreferencePersonRole,
  RuntimePreference,
} from "@/types/user";

type Step = "languages" | "content_type" | "questions";
type PreferenceView = "quiz" | "advanced";

type PersonSearchResult = {
  id: number;
  name: string;
  department?: string;
  knownFor?: string;
};

function OnboardingAtmosphere() {
  return <CinematicBackdrop density="balanced" />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center relative overflow-hidden">
          <OnboardingAtmosphere />
          <AppHeader />
          <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin relative z-10" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: PreferenceView =
    searchParams.get("mode") === "advanced" ? "advanced" : "quiz";
  const queryStep = searchParams.get("step") as Step | null;
  const step: Step =
    queryStep === "content_type" || queryStep === "questions"
      ? queryStep
      : "languages";
  const queryIndex = Number(searchParams.get("q") ?? "0");
  const currentQIndex =
    step === "questions" && Number.isFinite(queryIndex)
      ? Math.max(0, Math.round(queryIndex))
      : 0;

  const [introReady, setIntroReady] = useState<boolean | null>(null); // null=checking
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<PreferencePerson[]>([]);

  const dynamicQuestions = useMemo(
    () => getQuestionsForTypes(selectedTypes),
    [selectedTypes]
  );

  const setOnboardingLocation = useCallback(
    (nextStep: Step, nextQuestionIndex = 0, push = true) => {
      const params = new URLSearchParams({ mode: view, step: nextStep });
      if (nextStep === "questions") {
        params.set("q", String(nextQuestionIndex));
      }
      const nextUrl = `/onboarding?${params.toString()}`;
      if (push) router.push(nextUrl);
      else router.replace(nextUrl);
    },
    [router, view]
  );

  useEffect(() => {
    (async () => {
      const userId = await getCurrentUserId();
      const seen = typeof window !== "undefined" &&
        localStorage.getItem("cindr_intro_seen") === "1";
      // Logged-in users and guests who've already seen it skip the intro
      setIntroReady(userId !== null || seen);

      const { preferences } = await getEffectivePreferences();
      setSelectedLangs(preferences.languages);
      setSelectedTypes(preferences.contentTypes);
      setSelectedGenres(preferences.genres);
      setYearFrom(preferences.yearFrom ? String(preferences.yearFrom) : "");
      setYearTo(preferences.yearTo ? String(preferences.yearTo) : "");
      setSelectedPeople(preferences.people ?? []);
      setAnswers((prev) => {
        const next = { ...prev };
        for (const question of getQuestionsForTypes(preferences.contentTypes)) {
          const selectedValues = question.options
            .map((option) => option.value)
            .filter((value) => preferences.moods.includes(value));
          if (selectedValues.length > 0) {
            next[question.id] = selectedValues;
          }
        }
        if (preferences.era && preferences.era !== "any") {
          next.movie_era = preferences.era.split(",").filter(Boolean);
        }
        if (
          preferences.runtimePreference &&
          preferences.runtimePreference !== "any"
        ) {
          next.series_commitment = [
            preferences.runtimePreference === "short"
              ? "mini"
              : preferences.runtimePreference,
          ];
        }
        return next;
      });
    })();
  }, []);

  const mainProgress =
    step === "languages"
      ? selectedLangs.length > 0 ? 1 : 0
      : step === "content_type"
      ? selectedTypes.length > 0 ? 2 : 1
      : 2;

  function toggleLang(code: string) {
    setSelectedLangs((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, code];
    });
  }

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  function toggleAnswer(questionId: string, value: string, multi?: boolean) {
    setAnswers((prev) => {
      const existing = prev[questionId] ?? [];
      if (multi) {
        const updated = existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value];
        return { ...prev, [questionId]: updated };
      }
      return { ...prev, [questionId]: [value] };
    });
  }

  function toggleGenre(id: number) {
    setSelectedGenres((prev) =>
      prev.includes(id)
        ? prev.filter((genreId) => genreId !== id)
        : [...prev, id]
    );
  }

  function normalizeYear(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(1870, Math.min(2100, Math.round(parsed)));
  }

  function addPerson(person: PersonSearchResult, role: PreferencePersonRole) {
    setSelectedPeople((prev) => {
      if (prev.some((item) => item.id === person.id && item.role === role)) {
        return prev;
      }
      if (prev.length >= 5) return prev;
      return [...prev, { id: person.id, name: person.name, role }];
    });
  }

  function removePerson(person: PreferencePerson) {
    setSelectedPeople((prev) =>
      prev.filter(
        (item) => !(item.id === person.id && item.role === person.role)
      )
    );
  }

  function buildPrefs(moods: string[]) {
    const fromYear = normalizeYear(yearFrom);
    const toYear = normalizeYear(yearTo);
    const eraSelections = answers.movie_era ?? [];
    const era = (
      eraSelections.length === 0 || eraSelections.includes("any")
        ? "any"
        : eraSelections.join(",")
    ) as EraPreference;
    const runtimeRaw = answers.series_commitment?.[0] ?? "any";
    const runtimePreference = (
      runtimeRaw === "mini" ? "short" : runtimeRaw
    ) as RuntimePreference;
    const moodValues = moods.filter(
      (value) =>
        ![
          "new",
          "modern",
          "classic",
          "any",
          "mini",
          "medium",
          "long",
        ].includes(value)
    );

    return {
      languages: selectedLangs,
      contentTypes: selectedTypes,
      moods: moodValues,
      genres: selectedGenres,
      yearFrom: fromYear && toYear && fromYear > toYear ? toYear : fromYear,
      yearTo: fromYear && toYear && fromYear > toYear ? fromYear : toYear,
      people: selectedPeople,
      era,
      runtimePreference,
    };
  }

  async function saveAdvancedFilters() {
    const allMoods: string[] = [];
    Object.values(answers).forEach((vals) => allMoods.push(...vals));
    const prefs = buildPrefs(allMoods);

    savePreferences(prefs);
    markOnboardingComplete();

    const userId = await getCurrentUserId();
    if (userId) {
      await upsertPreferences({ ...prefs, onboardingComplete: true });
    }

    router.push("/discover");
  }

  function handleNext() {
    if (step === "languages") {
      setOnboardingLocation("content_type");
    } else if (step === "content_type") {
      if (dynamicQuestions.length > 0) {
        setOnboardingLocation("questions", 0);
      } else {
        finish();
      }
    } else if (step === "questions") {
      if (currentQIndex < dynamicQuestions.length - 1) {
        setOnboardingLocation("questions", currentQIndex + 1);
      } else {
        finish();
      }
    }
  }

  function handleBack() {
    if (view === "advanced") {
      router.push("/discover");
      return;
    }
    if (step === "languages") {
      router.push("/discover");
      return;
    }
    window.history.back();
  }

  async function finish() {
    const allMoods: string[] = [];
    Object.values(answers).forEach((vals) => allMoods.push(...vals));
    const prefs = buildPrefs(allMoods);

    savePreferences(prefs);
    markOnboardingComplete();

    const userId = await getCurrentUserId();
    if (userId) {
      await upsertPreferences({ ...prefs, onboardingComplete: true });
    }

    router.push("/discover");
  }

  const canProceed =
    step === "languages"
      ? selectedLangs.length > 0
      : step === "content_type"
      ? selectedTypes.length > 0
      : (answers[dynamicQuestions[currentQIndex]?.id]?.length ?? 0) > 0;

  // Show intro for first-time guests
  if (introReady === false) {
    return (
      <OnboardingIntro
        onDone={() => {
          localStorage.setItem("cindr_intro_seen", "1");
          setIntroReady(true);
        }}
      />
    );
  }

  if (view === "advanced") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-3 pb-3 pt-20 sm:px-6 sm:pb-12 sm:pt-24 relative overflow-hidden">
        <OnboardingAtmosphere />
        <AppHeader />

        <div className="w-full max-w-md max-h-[calc(100dvh-6rem)] overflow-y-auto relative z-10 rounded-[1.5rem] border border-white/10 bg-[#111015]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:max-h-[calc(100dvh-7rem)] sm:rounded-[2rem] sm:p-7">
          <button
            type="button"
            onClick={() => router.push("/discover")}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <span>&larr;</span>
            Back to Discover
          </button>

          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Advanced filters
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted)] mb-6">
            Optional controls for narrowing discovery. Leave anything empty and
            Cindr will keep that part flexible.
          </p>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Release years
                </label>
                <span className="text-[10px] text-[var(--muted)]">Optional</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  min={1870}
                  max={2100}
                  placeholder="From"
                  value={yearFrom}
                  onChange={(event) => setYearFrom(event.target.value)}
                  className="min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--color-cindr)]"
                />
                <input
                  type="number"
                  min={1870}
                  max={2100}
                  placeholder="To"
                  value={yearTo}
                  onChange={(event) => setYearTo(event.target.value)}
                  className="min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--color-cindr)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {TMDB_GENRES.map((genre) => {
                  const selected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      type="button"
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "border-[var(--color-cindr)] bg-[var(--color-cindr)]/15 text-white"
                          : "border-[var(--border-color)] text-[var(--muted)] hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  People
                </label>
                <span className="text-[10px] text-[var(--muted)]">Optional</span>
              </div>
              <div className="grid gap-2.5">
                <PersonSearchField
                  role="actor"
                  selectedCount={selectedPeople.length}
                  onAdd={addPerson}
                />
                <PersonSearchField
                  role="director"
                  selectedCount={selectedPeople.length}
                  onAdd={addPerson}
                />
              </div>
              {selectedPeople.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPeople.map((person) => (
                    <button
                      type="button"
                      key={`${person.role}-${person.id}`}
                      onClick={() => removePerson(person)}
                      className="rounded-full border border-[var(--color-cindr)]/35 bg-[var(--color-cindr)]/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500/15"
                      title="Remove"
                    >
                      {person.name} · {person.role} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[0.45fr_1fr] gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/discover")}
              className="py-3.5 rounded-full border border-white/10 bg-white/[0.04] text-white/80 font-medium transition-all hover:border-white/20 hover:bg-white/[0.08]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={saveAdvancedFilters}
              className="py-3.5 rounded-full bg-[var(--color-cindr)] text-white font-medium transition-all hover:bg-[var(--color-cindr-hover)] shadow-[0_0_20px_rgba(216,90,48,0.15)]"
            >
              Save filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-3 pb-3 pt-20 sm:px-6 sm:pb-12 sm:pt-24 relative overflow-hidden">
      <OnboardingAtmosphere />
      <AppHeader />

      <div className="flex flex-col w-full max-w-md relative z-10 rounded-[1.5rem] border border-white/10 bg-[#111015]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:rounded-[2rem] sm:p-7" style={{ maxHeight: "calc(100dvh - 6rem)" }}>
        {/* Main progress: 0/2, 1/2, 2/2 */}
        <div className="shrink-0 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs text-[var(--muted)]">
              {mainProgress} of 2
            </span>
            {step === "questions" && dynamicQuestions.length > 0 && (
              <span className="text-xs text-[var(--muted)]">
                Question {currentQIndex + 1} of {dynamicQuestions.length}
              </span>
            )}
          </div>
          <div className="h-1 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-cindr)] transition-all duration-500"
              style={{ width: `${(mainProgress / 2) * 100}%` }}
            />
          </div>
          {step === "questions" && dynamicQuestions.length > 1 && (
            <div className="flex gap-1.5 mt-2">
              {dynamicQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= currentQIndex
                      ? "bg-[var(--color-cindr)]/60"
                      : "bg-[var(--border-color)]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {step === "languages" && (
            <LanguageStep selected={selectedLangs} onToggle={toggleLang} />
          )}

          {step === "content_type" && (
            <ContentTypeStep selected={selectedTypes} onToggle={toggleType} />
          )}

          {step === "questions" && dynamicQuestions[currentQIndex] && (
            <QuestionStep
              question={dynamicQuestions[currentQIndex]}
              answers={answers[dynamicQuestions[currentQIndex].id] ?? []}
              onToggle={(val) =>
                toggleAnswer(
                  dynamicQuestions[currentQIndex].id,
                  val,
                  dynamicQuestions[currentQIndex].multi
                )
              }
            />
          )}
        </div>

        <div className="shrink-0 mt-3 grid grid-cols-[0.45fr_1fr] gap-2 sm:mt-4 sm:gap-2.5">
          <button
            onClick={handleBack}
            className="py-2.5 text-sm rounded-full border border-white/10 bg-white/[0.04] text-white/80 font-medium transition-all hover:border-white/20 hover:bg-white/[0.08] sm:py-3.5 sm:text-base"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="py-2.5 text-sm rounded-full bg-[var(--color-cindr)] text-white font-medium transition-all hover:bg-[var(--color-cindr-hover)] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(216,90,48,0.15)] sm:py-3.5 sm:text-base"
          >
            {step === "questions" && currentQIndex === dynamicQuestions.length - 1
              ? "Start discovering"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonSearchField({
  role,
  selectedCount,
  onAdd,
}: {
  role: PreferencePersonRole;
  selectedCount: number;
  onAdd: (person: PersonSearchResult, role: PreferencePersonRole) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ query: trimmedQuery, role });
        const res = await fetch(`/api/tmdb/search-person?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results?: PersonSearchResult[] };
        setResults(data.results ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, role]);

  function handleAdd(person: PersonSearchResult) {
    onAdd(person, role);
    setQuery("");
    setResults([]);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
    }
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        placeholder={role === "actor" ? "Search actors" : "Search directors"}
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--color-cindr)]"
      />
      {(searching || results.length > 0) && (
        <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-1.5">
          {searching ? (
            <p className="px-2 py-2 text-xs text-[var(--muted)]">Searching...</p>
          ) : (
            results.slice(0, 6).map((person) => (
              <button
                type="button"
                key={person.id}
                onClick={() => handleAdd(person)}
                disabled={selectedCount >= 5}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>
                  <span className="block text-sm font-medium">{person.name}</span>
                  {person.knownFor && (
                    <span className="line-clamp-1 text-xs text-[var(--muted)]">
                      {person.department
                        ? `${person.department} · ${person.knownFor}`
                        : person.knownFor}
                    </span>
                  )}
                </span>
                <span className="text-xs capitalize text-[var(--color-cindr)]">
                  {role}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function LanguageStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (code: string) => void;
}) {
  return (
    <div className="mb-3">
      <h1 className="text-lg font-bold tracking-tight mb-0.5 sm:text-2xl sm:mb-1">
        What languages do you watch in?
      </h1>
      <p className="text-xs text-[var(--muted)] mb-2 sm:mb-4">
        Pick up to {MAX_LANGUAGES}.
      </p>
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
        {LANGUAGES.map((lang) => {
          const isSelected = selected.includes(lang.code);
          const isDisabled = !isSelected && selected.length >= MAX_LANGUAGES;
          return (
            <button
              key={lang.code}
              onClick={() => onToggle(lang.code)}
              disabled={isDisabled}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all text-left sm:gap-2 sm:p-2.5 ${
                isSelected
                  ? "border-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : isDisabled
                  ? "border-[var(--border-color)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                  : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--muted)]"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[8px] font-semibold uppercase tracking-wide text-[var(--color-cindr)] sm:h-7 sm:w-7 sm:text-[9px]">
                {lang.code}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-medium sm:text-xs">{lang.name}</div>
                <div className="truncate text-[9px] text-[var(--muted)] sm:text-[10px]">
                  {lang.nativeName}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContentTypeStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mb-4 sm:mb-8">
      <h1 className="text-xl font-bold tracking-tight mb-1 sm:text-2xl sm:mb-2">
        What are you looking for?
      </h1>
      <p className="text-xs text-[var(--muted)] mb-3 sm:text-sm sm:mb-6">Pick all that apply.</p>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
        {CONTENT_TYPES.map((type) => {
          const isSelected = selected.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => onToggle(type.value)}
              className={`p-3 rounded-xl border transition-all text-left sm:p-4 ${
                isSelected
                  ? "border-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--muted)]"
              }`}
            >
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionStep({
  question,
  answers,
  onToggle,
}: {
  question: QuizQuestion;
  answers: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mb-4 sm:mb-8">
      <h1 className="text-xl font-bold tracking-tight mb-1 sm:text-2xl sm:mb-2">
        {question.question}
      </h1>
      {question.multi && (
        <p className="text-xs text-[var(--muted)] mb-3 sm:text-sm sm:mb-6">
          Pick as many as you like.
        </p>
      )}
      <div className="flex flex-col gap-1.5 mt-3 sm:gap-2.5 sm:mt-4">
        {question.options.map((opt) => {
          const isSelected = answers.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left sm:p-4 ${
                isSelected
                  ? "border-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--muted)]"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isSelected
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {opt.label}
              </span>
              {isSelected && (
                <span className="w-5 h-5 rounded-full bg-[var(--color-cindr)] flex items-center justify-center flex-shrink-0">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
