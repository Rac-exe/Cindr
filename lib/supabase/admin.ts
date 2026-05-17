import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type MediaTrailerRegistryRow = {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  release_year: number | null;
  youtube_key: string | null;
  youtube_url: string | null;
  source: "tmdb" | "youtube" | "none";
  status: "ready" | "no_trailer" | "error";
  resolved_at: string;
  last_checked_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseAdminDatabase = {
  public: {
    Tables: {
      media_trailer_registry: {
        Row: MediaTrailerRegistryRow;
        Insert: Omit<
          MediaTrailerRegistryRow,
          "youtube_url" | "created_at" | "updated_at"
        > & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<MediaTrailerRegistryRow, "youtube_url" | "created_at">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let adminClient: SupabaseClient<SupabaseAdminDatabase> | null = null;

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server-owned Supabase writes."
    );
  }

  adminClient ??= createClient<SupabaseAdminDatabase>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return adminClient;
}
