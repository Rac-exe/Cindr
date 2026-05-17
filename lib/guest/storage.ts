import { GuestState, UserPreferences } from "@/types/user";

const STORAGE_KEY = "cindr_guest";

const DEFAULT_STATE: GuestState = {
  preferences: {
    languages: [],
    genres: [],
    moods: [],
    contentTypes: [],
    yearFrom: null,
    yearTo: null,
    people: [],
  },
  onboardingComplete: false,
  swipedIds: [],
  isAdult: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getGuestState(): GuestState {
  if (!isBrowser()) return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<GuestState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_STATE.preferences, ...parsed.preferences },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGuestState(state: Partial<GuestState>): void {
  if (!isBrowser()) return;
  const current = getGuestState();
  const merged = { ...current, ...state };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = getGuestState();
  saveGuestState({
    preferences: { ...current.preferences, ...prefs },
  });
}

export function markOnboardingComplete(): void {
  saveGuestState({ onboardingComplete: true });
}

export function addSwipedId(id: number): void {
  const current = getGuestState();
  if (!current.swipedIds.includes(id)) {
    saveGuestState({ swipedIds: [...current.swipedIds, id] });
  }
}

export function removeSwipedId(id: number): void {
  const current = getGuestState();
  saveGuestState({ swipedIds: current.swipedIds.filter((swipedId) => swipedId !== id) });
}

export function clearSwipedIds(): void {
  saveGuestState({ swipedIds: [] });
}

export function clearGuestState(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
