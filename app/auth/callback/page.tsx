"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { syncGuestToAccount, getDbPreferences } from "@/lib/supabase/core";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const returnTo = params.get("returnTo");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        }

        await syncGuestToAccount();
        const prefs = await getDbPreferences();
        const destination =
          returnTo?.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : prefs?.onboarding_complete
            ? "/discover"
            : "/onboarding?mode=quiz";

        router.replace(destination);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="relative flex h-[100svh] items-center justify-center overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <div className="relative z-10 text-center">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-cindr)]" />
            <p className="text-sm text-white/50">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}
