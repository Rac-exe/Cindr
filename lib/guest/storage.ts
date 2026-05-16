import { GuestState, UserPreferences } from "@/types/user";

const STORAGE_KEY = "cindr_guest";

const DEFAULT_STATE: GuestState = {
  preferences: { languages: [], genres: [], moods: [] },
  onboardingComplete: false,
  swipedIds: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getGuestState(): GuestState {
  if (!isBrowser()) return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as GuestState;
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

export function clearGuestState(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
