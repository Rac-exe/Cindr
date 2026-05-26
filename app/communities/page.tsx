"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import type { Community } from "@/types/social";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    try {
      const res = await fetch("/api/communities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCommunities(data.communities ?? []);
    } catch {
      // silently fail — empty list is a fine fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  async function handleJoinToggle(community: Community) {
    setJoining(community.id);
    try {
      await fetch(`/api/communities/${community.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: community.is_member ? "leave" : "join" }),
      });
      await fetchCommunities();
    } finally {
      setJoining(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <CinematicBackdrop density="balanced" />
      <AppHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-20 md:px-8 md:pt-24">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-cindr)]">
            Social
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            Communities
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Find your genre. Find your people.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-white/8 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {communities.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                joining={joining === c.id}
                onJoinToggle={handleJoinToggle}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface CardProps {
  community: Community;
  joining: boolean;
  onJoinToggle: (c: Community) => void;
}

function CommunityCard({ community, joining, onJoinToggle }: CardProps) {
  const accent = community.accent_color ?? "#D85A30";

  return (
    <div
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-colors hover:bg-white/[0.07]"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* Accent glow top-left */}
      <div
        className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />

      {/* Name + member count */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold leading-snug text-white">{community.name}</h2>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
            <Users size={12} />
            <span>{community.member_count.toLocaleString()} members</span>
          </div>
        </div>
        <Link
          href={`/communities/${community.slug}`}
          className="mt-0.5 shrink-0 text-white/30 transition-colors hover:text-white/70"
          aria-label={`Open ${community.name}`}
        >
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-white/50">
        {community.description}
      </p>

      {/* Genre tags */}
      <div className="flex flex-wrap gap-1">
        {community.genre_tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: `${accent}22`, color: accent }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Join/Leave button */}
      <button
        onClick={() => onJoinToggle(community)}
        disabled={joining}
        className="mt-auto w-full rounded-xl py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        style={
          community.is_member
            ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
            : { background: accent, color: "#fff" }
        }
      >
        {joining ? "..." : community.is_member ? "Leave" : "Join"}
      </button>
    </div>
  );
}
