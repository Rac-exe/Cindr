export interface QuizOption {
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  multi?: boolean;
}

// Content types the user can pick (multi-select)
export const CONTENT_TYPES: QuizOption[] = [
  { label: "Movies", value: "movies" },
  { label: "TV Shows & Series", value: "series" },
  { label: "Short Films", value: "short" },
  { label: "Documentaries", value: "documentaries" },
];

// Questions specific to each content type
const MOVIE_QUESTIONS: QuizQuestion[] = [
  {
    id: "movie_mood",
    question: "What kind of movies hit different for you?",
    options: [
      { label: "Edge-of-your-seat thrillers", value: "thriller" },
      { label: "Laugh-out-loud comedies", value: "comedy" },
      { label: "Stories that stay with you", value: "drama" },
      { label: "Mind-bending sci-fi", value: "scifi" },
      { label: "Something that scares me", value: "horror" },
      { label: "A good love story", value: "romance" },
    ],
    multi: true,
  },
  {
    id: "movie_era",
    question: "How recent should the movies be?",
    options: [
      { label: "Just the latest releases", value: "new" },
      { label: "2000s to 2010s era", value: "modern" },
      { label: "Timeless classics", value: "classic" },
      { label: "Mix it up", value: "any" },
    ],
  },
];

const SERIES_QUESTIONS: QuizQuestion[] = [
  {
    id: "series_mood",
    question: "What kind of shows do you binge?",
    options: [
      { label: "Crime & detective stories", value: "crime" },
      { label: "Dramas I can't stop watching", value: "drama" },
      { label: "Sitcoms & feel-good shows", value: "comedy" },
      { label: "Sci-fi & fantasy worlds", value: "scifi_fantasy" },
      { label: "Reality & competition shows", value: "reality" },
      { label: "Anime", value: "anime" },
    ],
    multi: true,
  },
  {
    id: "series_length",
    question: "How deep do you want to go?",
    options: [
      { label: "Mini-series (one season)", value: "mini" },
      { label: "A few seasons to explore", value: "medium" },
      { label: "Long-running epics", value: "long" },
      { label: "Doesn't matter", value: "any" },
    ],
  },
];

const DOCUMENTARY_QUESTIONS: QuizQuestion[] = [
  {
    id: "doc_topic",
    question: "What topics fascinate you?",
    options: [
      { label: "True crime & mysteries", value: "true_crime" },
      { label: "Nature & wildlife", value: "nature" },
      { label: "History & politics", value: "history" },
      { label: "Science & technology", value: "science" },
      { label: "Music & culture", value: "culture" },
      { label: "Sports", value: "sports" },
    ],
    multi: true,
  },
];

const SHORT_QUESTIONS: QuizQuestion[] = [
  {
    id: "short_vibe",
    question: "What vibe are you after?",
    options: [
      { label: "Experimental & arthouse", value: "arthouse" },
      { label: "Animated shorts", value: "animated" },
      { label: "Heartfelt stories", value: "heartfelt" },
      { label: "Dark & twisted", value: "dark" },
    ],
    multi: true,
  },
];

export function getQuestionsForTypes(types: string[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const seen = new Set<string>();

  for (const type of types) {
    let typeQuestions: QuizQuestion[] = [];
    switch (type) {
      case "movies":
        typeQuestions = MOVIE_QUESTIONS;
        break;
      case "series":
        typeQuestions = SERIES_QUESTIONS;
        break;
      case "documentaries":
        typeQuestions = DOCUMENTARY_QUESTIONS;
        break;
      case "short":
        typeQuestions = SHORT_QUESTIONS;
        break;
    }
    for (const q of typeQuestions) {
      if (!seen.has(q.id)) {
        seen.add(q.id);
        questions.push(q);
      }
    }
  }

  return questions;
}

export const MOOD_TO_GENRES: Record<string, number[]> = {
  thriller: [53, 28, 80],
  comedy: [35],
  drama: [18],
  scifi: [878, 9648],
  horror: [27],
  romance: [10749],
  crime: [80, 9648],
  scifi_fantasy: [878, 14],
  reality: [10764],
  anime: [16],
  true_crime: [80, 99],
  nature: [99],
  history: [36, 99],
  science: [99, 878],
  culture: [10402, 99],
  sports: [99],
  arthouse: [18],
  animated: [16],
  heartfelt: [18, 10749],
  dark: [53, 27],
};
