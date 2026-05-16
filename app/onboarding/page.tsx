"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, MAX_LANGUAGES } from "@/lib/constants/languages";
import { CONTENT_TYPES, getQuestionsForTypes, MOOD_TO_GENRES } from "@/lib/constants/quiz";
import type { QuizQuestion } from "@/lib/constants/quiz";
import { savePreferences, markOnboardingComplete } from "@/lib/guest/storage";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

type Step = "languages" | "content_type" | "questions";

function OnboardingAtmosphere() {
  return <CinematicBackdrop density="balanced" />;
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("languages");
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const dynamicQuestions = useMemo(
    () => getQuestionsForTypes(selectedTypes),
    [selectedTypes]
  );

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

  function handleNext() {
    if (step === "languages") {
      setStep("content_type");
    } else if (step === "content_type") {
      if (dynamicQuestions.length > 0) {
        setCurrentQIndex(0);
        setStep("questions");
      } else {
        finish();
      }
    } else if (step === "questions") {
      if (currentQIndex < dynamicQuestions.length - 1) {
        setCurrentQIndex((i) => i + 1);
      } else {
        finish();
      }
    }
  }

  function finish() {
    const allMoods: string[] = [];
    Object.values(answers).forEach((vals) => allMoods.push(...vals));
    const genreIds = new Set<number>();
    allMoods.forEach((m) => {
      const ids = MOOD_TO_GENRES[m];
      if (ids) ids.forEach((id) => genreIds.add(id));
    });

    savePreferences({
      languages: selectedLangs,
      contentTypes: selectedTypes,
      moods: allMoods,
      genres: Array.from(genreIds),
    });
    markOnboardingComplete();
    router.push("/discover");
  }

  const canProceed =
    step === "languages"
      ? selectedLangs.length > 0
      : step === "content_type"
      ? selectedTypes.length > 0
      : (answers[dynamicQuestions[currentQIndex]?.id]?.length ?? 0) > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-12 relative overflow-hidden">
      <OnboardingAtmosphere />

      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto relative z-10 rounded-[2rem] border border-white/10 bg-[#111015]/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-7">
        {/* Main progress: 0/2, 1/2, 2/2 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
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

        <div className="min-h-[420px]">
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

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full py-3.5 rounded-full bg-[var(--color-cindr)] text-white font-medium transition-all hover:bg-[var(--color-cindr-hover)] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(216,90,48,0.15)]"
        >
          {step === "questions" && currentQIndex === dynamicQuestions.length - 1
            ? "Start discovering"
            : "Continue"}
        </button>
      </div>
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
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        What languages do you watch in?
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Pick up to {MAX_LANGUAGES}.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {LANGUAGES.map((lang) => {
          const isSelected = selected.includes(lang.code);
          const isDisabled = !isSelected && selected.length >= MAX_LANGUAGES;
          return (
            <button
              key={lang.code}
              onClick={() => onToggle(lang.code)}
              disabled={isDisabled}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                isSelected
                  ? "border-[var(--color-cindr)] bg-[var(--color-cindr)]/10"
                  : isDisabled
                  ? "border-[var(--border-color)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                  : "border-[var(--border-color)] bg-[var(--surface)] hover:border-[var(--muted)]"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-wide text-[var(--color-cindr)]">
                {lang.code}
              </span>
              <div>
                <div className="text-sm font-medium">{lang.name}</div>
                <div className="text-xs text-[var(--muted)]">
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
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        What are you looking for?
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">Pick all that apply.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {CONTENT_TYPES.map((type) => {
          const isSelected = selected.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => onToggle(type.value)}
              className={`p-4 rounded-xl border transition-all text-left ${
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
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        {question.question}
      </h1>
      {question.multi && (
        <p className="text-sm text-[var(--muted)] mb-6">
          Pick as many as you like.
        </p>
      )}
      <div className="flex flex-col gap-2.5 mt-4">
        {question.options.map((opt) => {
          const isSelected = answers.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
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
