"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { clearGuestState } from "@/lib/guest/storage";
import {
  ensureProfileFromAuth,
  getDbPreferences,
  updateProfileAvatar,
  updateProfileDateOfBirth,
} from "@/lib/supabase/core";
import { buildCloudinaryAvatarUrl } from "@/lib/cloudinary/avatar";
import type { Profile, DbUserPreferences } from "@/types/user";
import AppHeader from "@/components/layout/AppHeader";
import MobileNav from "@/components/layout/MobileNav";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { Camera, Trash } from "@phosphor-icons/react";

function calculateIsAdult(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const birth = new Date(dateString);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age >= 18;
}

export default function ProfilePage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<DbUserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [dobDraft, setDobDraft] = useState("");
  const [dobSaving, setDobSaving] = useState(false);
  const [dobMessage, setDobMessage] = useState("");
  const [isEditingDob, setIsEditingDob] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const [p, pr] = await Promise.all([
          ensureProfileFromAuth(),
          getDbPreferences(),
        ]);
        setProfile(p);
        setPrefs(pr);
        setDobDraft(
          p?.date_of_birth ??
            (currentUser.user_metadata?.date_of_birth as string | undefined) ??
            ""
        );
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

  async function handleSaveDob() {
    if (!dobDraft) {
      setDobMessage("Pick your date of birth first.");
      return;
    }

    setDobSaving(true);
    setDobMessage("");
    try {
      const updatedProfile = await updateProfileDateOfBirth(dobDraft);
      if (updatedProfile) {
        setProfile(updatedProfile);
        setUser((prev) =>
          prev
            ? ({
                ...prev,
                user_metadata: {
                  ...prev.user_metadata,
                  date_of_birth: dobDraft,
                  is_adult: updatedProfile.is_adult,
                },
              } as User)
            : prev
        );
        setDobMessage("Date of birth saved.");
        setIsEditingDob(false);
      } else {
        setDobMessage("Could not save date of birth.");
      }
    } catch {
      setDobMessage("Could not save date of birth. Please try again.");
    } finally {
      setDobSaving(false);
    }
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
              <svg className="w-14 h-14 text-[var(--color-cindr)] opacity-40" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="2" />
                <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="10" fill="currentColor" />
              </svg>
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
        <MobileNav />
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
  const isAdult =
    Boolean(profile?.is_adult) ||
    calculateIsAdult(dateOfBirth) ||
    user.user_metadata?.is_adult === true ||
    user.user_metadata?.is_adult === "true";
  const preferenceSummary = prefs
    ? [
        prefs.languages.length > 0
          ? prefs.languages.map((l) => l.toUpperCase()).join(", ")
          : null,
        prefs.content_types.length > 0
          ? prefs.content_types.join(", ")
          : null,
      ].filter(Boolean).join(" • ")
    : "Not set";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <CinematicBackdrop density="subtle" />
      <AppHeader />
      <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 max-w-md mx-auto w-full relative z-10">
        <div className="rounded-[2rem] border border-white/10 bg-[#111015]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <Link
          href="/discover"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <span>&larr;</span>
          Back to Discover
        </Link>

        <div className="text-center mb-8">
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
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-[var(--color-cindr)] text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:opacity-60"
              aria-label="Change profile photo"
            >
              <Camera size={16} weight="bold" />
            </button>
          </div>
          <div className="mb-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {profile?.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash size={13} />
                Remove
              </button>
            )}
          </div>
          {avatarMessage && (
            <p className="mb-3 text-xs text-[var(--muted)]">{avatarMessage}</p>
          )}
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.04]">
            <span className="text-sm text-[var(--muted)]">Age gate</span>
            <span className={`text-sm font-medium ${isAdult ? "text-[var(--color-cindr)]" : "text-[var(--foreground)]"}`}>
              {isAdult ? "18+" : "Under 18"}
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--muted)]">Date of birth</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${dateOfBirth ? "text-white" : "text-yellow-400"}`}>
                  {dateOfBirth ?? "Missing"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDobDraft(dateOfBirth ?? "");
                    setDobMessage("");
                    setIsEditingDob((current) => !current);
                  }}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {dateOfBirth ? "Edit" : "Add"}
                </button>
              </div>
            </div>
            {isEditingDob && (
              <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                <input
                  type="date"
                  value={dobDraft}
                  onChange={(e) => setDobDraft(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--color-cindr)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveDob}
                  disabled={dobSaving}
                  className="rounded-xl bg-[var(--color-cindr)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:opacity-50"
                >
                  {dobSaving ? "Saving" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDobDraft(dateOfBirth ?? "");
                    setDobMessage("");
                    setIsEditingDob(false);
                  }}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
            {dobMessage && (
              <p className="mt-2 text-xs text-[var(--muted)]">{dobMessage}</p>
            )}
          </div>
          {!dateOfBirth && (
            <p className="px-1 text-xs leading-relaxed text-yellow-400/90">
              Date of birth is missing, so Cindr cannot fully verify age-gated content.
            </p>
          )}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Preferences</span>
              <span className={`text-xs font-medium ${prefs?.onboarding_complete ? "text-green-400" : "text-yellow-400"}`}>
                {prefs?.onboarding_complete ? "Ready" : "Incomplete"}
              </span>
            </div>
            <p className="text-sm font-medium capitalize text-white/90">
              {preferenceSummary || "Not set"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/onboarding?mode=quiz"
            className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
          >
            <span className="text-sm font-medium">Update preferences</span>
            <span className="text-[var(--muted)]">&rarr;</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/5 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
