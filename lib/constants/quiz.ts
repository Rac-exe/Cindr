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

export const CONTENT_TYPES: QuizOption[] = [
  { label: "Movies", value: "movies" },
  { label: "TV Shows & Series", value: "series" },
  { label: "Anime", value: "anime" },
  { label: "Documentaries", value: "documentaries" },
];

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
    multi: true,
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
      { label: "K-dramas & international", value: "international" },
    ],
    multi: true,
  },
  {
    id: "series_commitment",
    question: "What kind of commitment sounds right?",
    options: [
      { label: "One perfect season — in and out", value: "mini" },
      { label: "A slow-burn world to get lost in", value: "medium" },
      { label: "A long-running comfort binge", value: "long" },
      { label: "Doesn't matter if it hooks me", value: "any" },
    ],
  },
];

const ANIME_QUESTIONS: QuizQuestion[] = [
  {
    id: "anime_genre",
    question: "What pulls you into an anime?",
    options: [
      { label: "Shonen battles & power-ups", value: "anime_action" },
      { label: "Emotional slice-of-life", value: "anime_sol" },
      { label: "Dark & psychological thrillers", value: "anime_thriller" },
      { label: "Romance & coming-of-age", value: "anime_romance" },
      { label: "Isekai & fantasy worlds", value: "anime_fantasy" },
      { label: "Mecha & sci-fi", value: "anime_scifi" },
    ],
    multi: true,
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
      case "anime":
        typeQuestions = ANIME_QUESTIONS;
        break;
      case "documentaries":
        typeQuestions = DOCUMENTARY_QUESTIONS;
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

export const MOVIE_MOOD_TO_GENRES: Record<string, number[]> = {
  thriller: [53, 28, 80],
  comedy: [35],
  drama: [18],
  scifi: [878, 9648],
  horror: [27],
  romance: [10749],
  crime: [80, 9648],
  scifi_fantasy: [878, 14],
};

export const TV_MOOD_TO_GENRES: Record<string, number[]> = {
  thriller: [80, 9648],
  comedy: [35],
  drama: [18],
  scifi: [10765, 9648],
  horror: [9648],
  romance: [18],
  crime: [80, 9648],
  scifi_fantasy: [10765],
  reality: [10764],
  international: [18],
};

export const ANIME_MOVIE_MOOD_TO_GENRES: Record<string, number[]> = {
  anime_action: [28, 16],
  anime_sol: [18, 16],
  anime_thriller: [53, 9648, 16],
  anime_romance: [10749, 16],
  anime_fantasy: [14, 16],
  anime_scifi: [878, 16],
};

export const ANIME_TV_MOOD_TO_GENRES: Record<string, number[]> = {
  anime_action: [10759, 16],
  anime_sol: [18, 16],
  anime_thriller: [9648, 16],
  anime_romance: [18, 16],
  anime_fantasy: [10765, 16],
  anime_scifi: [10765, 16],
};

export const DOCUMENTARY_MOVIE_TOPIC_GENRES: Record<string, number[]> = {
  true_crime: [80],
  nature: [],
  history: [36],
  science: [],
  culture: [10402],
  sports: [],
};

export const DOCUMENTARY_TV_TOPIC_GENRES: Record<string, number[]> = {
  true_crime: [80],
  nature: [],
  history: [],
  science: [],
  culture: [],
  sports: [],
};
