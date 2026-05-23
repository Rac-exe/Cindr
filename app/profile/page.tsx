"use client";

import { type FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { clearGuestState } from "@/lib/guest/storage";
import { saveTasteProfile, hydrateTasteProfile } from "@/lib/recommendations/tasteProfile";
import {
  ensureProfileFromAuth,
  getProfileDashboardData,
  saveTasteFingerprint,
  submitFeedbackReport,
  updateProfileAvatar,
} from "@/lib/supabase/core";
import { buildCloudinaryAvatarUrl } from "@/lib/cloudinary/avatar";
import type { FeedbackCategory, Profile, ProfileDashboardData } from "@/types/user";
import AppHeader from "@/components/layout/AppHeader";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { Camera, ChatCircleText, Trash, UserCircle } from "@phosphor-icons/react";

export default function ProfilePage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<ProfileDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("feedback");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [clearTasteOpen, setClearTasteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const [p, dashboardData] = await Promise.all([
          ensureProfileFromAuth(),
          getProfileDashboardData(),
        ]);
        setProfile(p);
        setDashboard(dashboardData);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearGuestState();
    router.push("/");
  }

  async function handleClearTaste() {
    const reset = hydrateTasteProfile({ swipeCount: 0, likeCount: 0, updatedAt: Date.now() });
    saveTasteProfile(reset);
    await saveTasteFingerprint(reset);
    setClearTasteOpen(false);
  }

  function setLocalAvatarPreview(file: File) {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const nextPreview = URL.createObjectURL(file);
    previewObjectUrlRef.current = nextPreview;
    setAvatarPreview(nextPreview);
  }

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarMessage("");
    if (!file.type.startsWith("image/")) {
      setAvatarMessage("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarMessage("Choose an image under 8 MB.");
      return;
    }

    setLocalAvatarPreview(file);
    setAvatarUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setAvatarMessage("Sign in again to update your photo.");
        return;
      }

      const signRes = await fetch("/api/cloudinary/sign-profile-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const signed = (await signRes.json()) as {
        apiKey?: string;
        cloudName?: string;
        folder?: string;
        publicId?: string;
        signature?: string;
        timestamp?: number;
        error?: string;
      };

      if (
        !signRes.ok ||
        !signed.apiKey ||
        !signed.cloudName ||
        !signed.publicId ||
        !signed.signature ||
        !signed.timestamp
      ) {
        throw new Error(signed.error ?? "Could not sign upload.");
      }

      const form = new FormData();
      form.set("file", file);
      form.set("api_key", signed.apiKey ?? "");
      form.set("timestamp", String(signed.timestamp));
      form.set("signature", signed.signature);
      form.set("folder", signed.folder ?? "cindr/profiles");
      form.set("public_id", signed.publicId ?? "");
      form.set("overwrite", "true");
      form.set("invalidate", "true");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      const uploaded = (await uploadRes.json()) as {
        public_id?: string;
        secure_url?: string;
        error?: { message?: string };
      };

      if (!uploadRes.ok || !uploaded.public_id) {
        throw new Error(uploaded.error?.message ?? "Upload failed.");
      }

      const avatarUrl =
        buildCloudinaryAvatarUrl(uploaded.public_id) || uploaded.secure_url || "";
      const updatedProfile = await updateProfileAvatar({
        avatarPublicId: uploaded.public_id,
        avatarUrl,
      });

      if (!updatedProfile) {
        throw new Error("Could not save profile photo.");
      }

      setProfile(updatedProfile);
      setAvatarPreview("");
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setAvatarMessage("Profile photo updated.");
    } catch (error) {
      setAvatarMessage(
        error instanceof Error
          ? error.message
          : "Could not update profile photo."
      );
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUploading(true);
    setAvatarMessage("");
    try {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      const updatedProfile = await updateProfileAvatar({
        avatarPublicId: null,
        avatarUrl: null,
      });
      if (!updatedProfile) {
        throw new Error("Could not remove profile photo.");
      }
      setProfile(updatedProfile);
      setAvatarPreview("");
      setAvatarMessage("Profile photo removed.");
    } catch (error) {
      setAvatarMessage(
        error instanceof Error
          ? error.message
          : "Could not remove profile photo."
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  function openFeedbackModal(category: FeedbackCategory = "feedback") {
    setFeedbackCategory(category);
    setFeedbackStatus("");
    setFeedbackOpen(true);
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackStatus("Please write something before submitting.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackStatus("");
    try {
      await submitFeedbackReport({
        category: feedbackCategory,
        message,
        pagePath: typeof window === "undefined" ? null : window.location.pathname,
        userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
      });
      setFeedbackMessage("");
      setFeedbackStatus("Thanks, your report has been saved.");
      setDashboard((current) =>
        current
          ? {
              ...current,
              support: {
                ...current.support,
                feedbackReports: current.support.feedbackReports + 1,
                openReports: current.support.openReports + 1,
              },
            }
          : current
      );
    } catch {
      setFeedbackStatus("Could not submit this right now. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <CinematicBackdrop density="subtle" />
        <div className="w-8 h-8 border-2 border-[var(--color-cindr)] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <CinematicBackdrop density="balanced" />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16 relative z-10">
          <Link
            href="/discover"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <span>&larr;</span>
            Back to Discover
          </Link>
          <div className="text-center max-w-xs rounded-[2rem] border border-white/10 bg-[#111015]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="mb-4 flex justify-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-cindr)]/30 bg-[var(--color-cindr)]/10 text-[var(--color-cindr)]">
                <UserCircle size={34} weight="duotone" />
              </div>
            </div>
            <h1 className="text-xl font-bold mb-2">Your Profile</h1>
            <p className="text-sm text-[var(--muted)] mb-6">
              Sign in to manage your preferences, track your activity, and
              personalise your experience.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/auth/signup"
                className="w-full py-3 rounded-full bg-[var(--color-cindr)] text-white text-sm font-medium text-center"
              >
                Create account
              </Link>
              <Link
                href="/auth/login"
                className="w-full py-3 rounded-full border border-[var(--border-color)] text-sm font-medium text-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const displayName =
    profile?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "User";
  const avatarUrl = avatarPreview || profile?.avatar_url || "";
  const dateOfBirth =
    profile?.date_of_birth ??
    (user.user_metadata?.date_of_birth as string | undefined) ??
    null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-24 md:pb-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#111015]/82 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
        <Link
          href="/discover"
          className="mb-5 inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <span>&larr;</span>
          Back to Discover
        </Link>

        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-3 h-20 w-20">
            <div
              role={avatarUrl ? "img" : undefined}
              aria-label={avatarUrl ? `${displayName} profile photo` : undefined}
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-cindr)]/20 bg-cover bg-center"
              style={
                avatarUrl
                  ? { backgroundImage: `url("${avatarUrl}")` }
                  : undefined
              }
            >
              {!avatarUrl && (
                <span className="text-3xl font-bold text-[var(--color-cindr)]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarFileChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[var(--color-cindr)] text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:opacity-60"
              aria-label="Change profile photo"
            >
              <Camera size={18} weight="bold" />
            </button>
          </div>
          <div className="mb-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="inline-flex h-9 items-center rounded-full border border-white/10 px-3 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {profile?.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/20 px-3 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash size={14} />
                Remove
              </button>
            )}
          </div>
          {avatarMessage && (
            <p className="mb-3 text-xs text-[var(--muted)]">{avatarMessage}</p>
          )}
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{displayName}</h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>

        <div className="mb-6 flex flex-col gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--muted)]">Date of birth</span>
              <span className={`text-sm font-medium ${dateOfBirth ? "text-white" : "text-yellow-400"}`}>
                {dateOfBirth ?? "Missing"}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <span className="text-sm text-[var(--muted)]">Library</span>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ["Liked", dashboard?.library.liked ?? 0],
                ["Fav", dashboard?.library.favourite ?? 0],
                ["Seen", dashboard?.library.watched ?? 0],
                ["Rated", dashboard?.library.rated ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/20 px-1.5 py-2">
                  <p className="text-sm font-semibold text-white/90">{value}</p>
                  <p className="mt-0.5 text-[10px] text-white/42">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Support reports</span>
              <span className="text-sm font-semibold text-white/90">
                {dashboard?.support.feedbackReports ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/45">
              {dashboard?.support.openReports ?? 0} open report
              {(dashboard?.support.openReports ?? 0) === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={() => openFeedbackModal("feedback")}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <ChatCircleText size={18} />
              Feedback / report issue
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setClearTasteOpen(true)}
            className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-white/8 px-4 text-left text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/70"
          >
            <Trash size={18} className="shrink-0 opacity-60" />
            Clear taste history
          </button>
          <button
            onClick={handleSignOut}
            className="h-12 w-full rounded-xl border border-red-500/20 px-4 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/5"
          >
            Sign out
          </button>
        </div>
        </div>
      </main>
      {clearTasteOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-6 sm:pb-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111015] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]">
              <Trash size={18} className="text-white/60" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-white">Clear taste history?</h2>
            <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
              This resets everything Cindr has learned from your swipes — genres, vibes, keywords, mood. Your liked films and saved activity are not affected. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setClearTasteOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearTaste}
                className="flex-1 rounded-xl bg-white/[0.08] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.14]"
              >
                Yes, clear it
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111015] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-cindr)]">
                  Help improve Cindr
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Send feedback
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Tell us what felt broken, confusing, or what you want next.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
                {(["feedback", "issue"] as FeedbackCategory[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFeedbackCategory(category)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      feedbackCategory === category
                        ? "bg-[var(--color-cindr)] text-white"
                        : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {category === "feedback" ? "Feedback" : "Report issue"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/75">
                  What happened?
                </span>
                <textarea
                  value={feedbackMessage}
                  onChange={(event) => setFeedbackMessage(event.target.value)}
                  rows={5}
                  placeholder="Example: The trailer opened but would not play on mobile..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[var(--color-cindr)]/60"
                />
              </label>

              {feedbackStatus && (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70">
                  {feedbackStatus}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="rounded-full bg-[var(--color-cindr)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {feedbackSubmitting ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
