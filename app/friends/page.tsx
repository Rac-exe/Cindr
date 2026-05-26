"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, Link as LinkIcon, Users } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import CinematicBackdrop from "@/components/layout/CinematicBackdrop";
import { supabase } from "@/lib/supabase/client";
import type { FriendProfile } from "@/types/social";

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : undefined;
}

type Tab = "friends" | "pending";

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      if (!auth) { setLoading(false); return; }
      const res = await fetch("/api/friends", {
        headers: { Authorization: auth },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFriends(data.friends ?? []);
      setPending(data.pending ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  async function handleRespond(friendshipId: string, accept: boolean) {
    setActioning(friendshipId);
    try {
      const auth = await getAuthHeader();
      await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify({ accept }),
      });
      await fetchFriends();
    } finally {
      setActioning(null);
    }
  }

  async function handleRemove(friendshipId: string) {
    setActioning(friendshipId);
    try {
      const auth = await getAuthHeader();
      await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) },
        body: JSON.stringify({ remove: true }),
      });
      await fetchFriends();
    } finally {
      setActioning(null);
    }
  }

  function handleCopyInvite() {
    const link = `${window.location.origin}/communities`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "pending", label: "Pending", count: pending.length },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <CinematicBackdrop density="balanced" />
      <AppHeader />

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-12 pt-20 md:px-8 md:pt-24">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-cindr)]">
              Social
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Friends
            </h1>
          </div>
          <button
            onClick={handleCopyInvite}
            className="mt-3 flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            {copiedInvite ? <Check size={13} /> : <LinkIcon size={13} />}
            {copiedInvite ? "Copied!" : "Invite link"}
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] leading-none">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-white/8 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <EmptyState
              icon={<Users size={32} className="text-white/20" />}
              title="No friends yet"
              subtitle={
                <>
                  Join a{" "}
                  <Link href="/communities" className="text-[var(--color-cindr)] underline">
                    community
                  </Link>{" "}
                  to find people who watch what you watch.
                </>
              }
            />
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <FriendRow
                  key={f.friendship.id}
                  friend={f}
                  actioning={actioning === f.friendship.id}
                  onRemove={() => handleRemove(f.friendship.id)}
                />
              ))}
            </div>
          )
        ) : pending.length === 0 ? (
          <EmptyState
            icon={<Check size={32} className="text-white/20" />}
            title="All caught up"
            subtitle="No pending friend requests."
          />
        ) : (
          <div className="space-y-2">
            {pending.map((f) => (
              <PendingRow
                key={f.friendship.id}
                friend={f}
                actioning={actioning === f.friendship.id}
                onAccept={() => handleRespond(f.friendship.id, true)}
                onDecline={() => handleRespond(f.friendship.id, false)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10">
      {src ? (
        <Image src={src} alt={name} fill className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/60">
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  );
}

function FriendRow({
  friend,
  actioning,
  onRemove,
}: {
  friend: FriendProfile;
  actioning: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <Avatar src={friend.avatar_url} name={friend.display_name} />
      <span className="flex-1 truncate text-sm text-white/80">{friend.display_name}</span>
      <button
        onClick={onRemove}
        disabled={actioning}
        className="rounded-lg border border-white/10 p-1.5 text-white/30 transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
        aria-label="Remove friend"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function PendingRow({
  friend,
  actioning,
  onAccept,
  onDecline,
}: {
  friend: FriendProfile;
  actioning: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <Avatar src={friend.avatar_url} name={friend.display_name} />
      <span className="flex-1 truncate text-sm text-white/80">{friend.display_name}</span>
      <div className="flex gap-1.5">
        <button
          onClick={onAccept}
          disabled={actioning}
          className="flex items-center gap-1 rounded-lg bg-[var(--color-cindr)] px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <Check size={12} />
          Accept
        </button>
        <button
          onClick={onDecline}
          disabled={actioning}
          className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 transition-colors hover:text-white/80 disabled:opacity-40"
        >
          <X size={12} />
          Decline
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon}
      <p className="text-sm font-medium text-white/40">{title}</p>
      <p className="text-xs text-white/30">{subtitle}</p>
    </div>
  );
}
