import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type LocalUser = {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
};

type TasteFingerprintRow = {
  user_id: string;
  fingerprint: unknown;
  swipe_count: number;
  updated_at: string;
};

type ClientDatabase = {
  public: {
    Tables: {
      taste_fingerprints: {
        Row: TasteFingerprintRow;
        Insert: TasteFingerprintRow;
        Update: Partial<TasteFingerprintRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const LOCAL_USER_KEY = "cindr_local_user";

function defaultLocalUser(): LocalUser {
  return {
    id: "local-user",
    email: "local@cindr.app",
    user_metadata: {
      display_name: "Local User",
      is_adult: true,
    },
  };
}

function getLocalUser(): LocalUser {
  if (typeof window === "undefined") return defaultLocalUser();
  const stored = window.localStorage.getItem(LOCAL_USER_KEY);
  if (stored) {
    try {
      return { ...defaultLocalUser(), ...JSON.parse(stored) };
    } catch {
      // Fall through and repair the local user record.
    }
  }
  const user = defaultLocalUser();
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  return user;
}

function setLocalUser(user: LocalUser) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  }
}

function createNoopQuery() {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    update: () => query,
    insert: () => query,
    upsert: () => query,
    delete: () => query,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (value: { data: null; error: null }) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  };
  return query;
}

function createLocalSupabaseClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: getLocalUser() }, error: null };
      },
      async getSession() {
        return {
          data: {
            session: {
              access_token: "local-session",
              user: getLocalUser(),
            },
          },
          error: null,
        };
      },
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        };
      },
      async signOut() {
        return { error: null };
      },
      async signInWithOAuth() {
        return { data: { url: null, provider: "google" }, error: null };
      },
      async signInWithPassword(input: { email: string }) {
        const user = { ...getLocalUser(), email: input.email };
        setLocalUser(user);
        return { data: { user, session: { access_token: "local-session", user } }, error: null };
      },
      async signUp(input: {
        email: string;
        options?: { data?: Record<string, unknown> };
      }) {
        const user = {
          ...getLocalUser(),
          email: input.email,
          user_metadata: {
            ...getLocalUser().user_metadata,
            ...(input.options?.data ?? {}),
          },
        };
        setLocalUser(user);
        return { data: { user, session: { access_token: "local-session", user } }, error: null };
      },
      async updateUser(input: { data?: Record<string, unknown> }) {
        const user = {
          ...getLocalUser(),
          user_metadata: {
            ...getLocalUser().user_metadata,
            ...(input.data ?? {}),
          },
        };
        setLocalUser(user);
        return { data: { user }, error: null };
      },
      async exchangeCodeForSession() {
        const user = getLocalUser();
        return { data: { user, session: { access_token: "local-session", user } }, error: null };
      },
    },
    from: () => createNoopQuery(),
  };
}

export const supabase = (
  supabaseUrl && supabaseAnonKey
    ? createClient<ClientDatabase>(supabaseUrl, supabaseAnonKey)
    : createLocalSupabaseClient()
) as SupabaseClient<ClientDatabase> & ReturnType<typeof createLocalSupabaseClient>;
