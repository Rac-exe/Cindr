export interface UserPreferences {
  languages: string[];
  genres: number[];
  moods: string[];
  contentTypes: string[];
}

export interface GuestState {
  preferences: UserPreferences;
  onboardingComplete: boolean;
  swipedIds: number[];
  isAdult: boolean;
}
