"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, UserPlus, Check } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import AppHeader from "@/components/layout/AppHeader";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { supabase } from "@/lib/supabase/client";
import type { Community, CommunityMember } from "@/types/social";

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : undefined;
}

export default function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  // Resolve community by slug from the list endpoint
  useEffect(() => {
    (async () => {
      const auth = await getAuthHeader();
      const r = await fetch("/api/communities", {
        headers: auth ? { Authorization: auth } : {},
      });
      const data = await r.json();
      const found = (data.communities as Community[])?.find((c) => c.slug === slug);
      setCommunity(found ?? null);
    })();
  }, [slug]);

  const fetchMembers = useCallback(
    async (pageNum: number) => {
      if (!community) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/communities/${community.id}/members?page=${pageNum}`
        );
        const data = await res.json();
        const newMembers: CommunityMember[] = data.members ?? [];
        setMembers((prev) => (pageNum === 0 ? newMembers : [...prev, ...newMembers]));
        setHasMore(newMembers.length === 20);
      } finally {
        setLoading(false);
      }
    },
    [community]
  );

  useEffect(() => {
    if (community) {
      setPage(0);
      fetchMembers(0);
    }
  }, [community, fetchMembers]);

  async function handleAddFriend(userId: string) {
    setRequesting(userId);
    try {
      const auth = await getAuthHeader();
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify({ addressee_id: userId }),
      });
    } finally {
      setRequesting(null);
    }
  }

  const accent = community?.accent_color ?? "#D85A30";

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <CinematicBackdrop density="balanced" />
      <AppHeader />

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-12 pt-20 md:px-8 md:pt-24">
        {/* Back link */}
        <Link
          href="/communities"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft size={14} />
          All communities
        </Link>

        {community ? (
          <>
            {/* Community header */}
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: `${accent}22`, color: accent }}
                >
                  {community.genre_tags[0]?.[0] ?? "C"}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold text-white">{community.name}</h1>
                  <p className="mt-1 text-sm text-white/50">{community.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
                </div>
              </div>
              <p className="mt-4 text-xs text-white/35">
                {community.member_count.toLocaleString()} members
              </p>
            </div>

            {/* Member list */}
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
              Members
            </h2>

            <div className="space-y-2">
              {members.map((m) => (
                <MemberRow
                  key={m.user_id}
                  member={m}
                  requesting={requesting === m.user_id}
                  onAddFriend={handleAddFriend}
                />
              ))}
            </div>

            {loading && (
              <div className="mt-4 flex justify-center py-6">
                <span className="text-sm text-white/30">Loading...</span>
              </div>
            )}

            {hasMore && !loading && (
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchMembers(next);
                }}
                className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
              >
                Load more
              </button>
            )}
          </>
        ) : (
          <div className="py-20 text-center text-white/30">
            {loading ? "Loading..." : "Community not found."}
          </div>
        )}
      </main>
    </div>
  );
}

interface MemberRowProps {
  member: CommunityMember;
  requesting: boolean;
  onAddFriend: (userId: string) => void;
}

function MemberRow({ member, requesting, onAddFriend }: MemberRowProps) {
  const [sent, setSent] = useState(false);

  async function handleClick() {
    await onAddFriend(member.user_id);
    setSent(true);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      {/* Avatar */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
        {member.avatar_url ? (
          <Image src={member.avatar_url} alt={member.display_name} fill className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/60">
            {member.display_name[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>

      {/* Name */}
      <span className="flex-1 truncate text-sm text-white/80">{member.display_name}</span>

      {/* Add friend */}
      <button
        onClick={handleClick}
        disabled={requesting || sent}
        className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80 disabled:opacity-40"
        aria-label={`Add ${member.display_name} as friend`}
      >
        {sent ? <Check size={12} /> : <UserPlus size={12} />}
        {sent ? "Sent" : "Add"}
      </button>
    </div>
  );
}
