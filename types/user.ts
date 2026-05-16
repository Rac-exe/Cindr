export interface UserPreferences {
  languages: string[];
  genres: number[];
  moods: string[];
}

export interface GuestState {
  preferences: UserPreferences;
  onboardingComplete: boolean;
  swipedIds: number[];
}
