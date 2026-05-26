import { supabase } from "./client";
import type {
  Community,
  CommunityMember,
  FriendProfile,
  Friendship,
  UserBadge,
} from "@/types/social";
import type { BadgeId } from "@/types/social";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Communities ──────────────────────────────────────────────────────────────

/** Fetch all communities. Populates `is_member` if user is logged in. */
export async function getCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("member_count", { ascending: false });

  if (error) throw new Error(error.message);

  const uid = await getCurrentUserId();
  if (!uid) return (data ?? []) as Community[];

  // Fetch which communities this user has joined in one query
  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", uid);

  const joined = new Set((memberships ?? []).map((m) => m.community_id));

  return (data ?? []).map((c) => ({ ...c, is_member: joined.has(c.id) })) as Community[];
}

/** Join a community. No-op if already a member. */
export async function joinCommunity(communityId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Must be signed in to join a community");

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: uid });

  // Ignore duplicate-key errors (already a member)
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

/** Leave a community. */
export async function leaveCommunity(communityId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Must be signed in to leave a community");

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", uid);

  if (error) throw new Error(error.message);
}

/** Paginated member list for a community (20 per page). */
export async function getCommunityMembers(
  communityId: string,
  page = 0
): Promise<CommunityMember[]> {
  const PAGE_SIZE = 20;

  const { data, error } = await supabase
    .from("community_members")
    .select("user_id, joined_at, profiles(display_name, avatar_url)")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: true })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: row.user_id,
      display_name: (p as { display_name: string | null })?.display_name ?? "Unknown",
      avatar_url: (p as { avatar_url: string | null })?.avatar_url ?? null,
      joined_at: row.joined_at,
    };
  });
}

/** Fetch all communities a specific user has joined. */
export async function getUserCommunities(userId: string): Promise<Community[]> {
  const { data, error } = await supabase
    .from("community_members")
    .select("communities(*)")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .flatMap((row) => (Array.isArray(row.communities) ? row.communities : [row.communities]))
    .filter(Boolean) as Community[];
}

// ── Friends ──────────────────────────────────────────────────────────────────

/** Send a friend request to another user. */
export async function sendFriendRequest(addresseeId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Must be signed in to send a friend request");
  if (uid === addresseeId) throw new Error("Cannot send a friend request to yourself");

  const { error } = await supabase.from("friendships").insert({
    requester_id: uid,
    addressee_id: addresseeId,
  });

  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

/** Accept or decline a friend request. Only the addressee can call this. */
export async function respondToRequest(
  friendshipId: string,
  accept: boolean
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
}

/** Remove an accepted friendship (unfriend). */
export async function removeFriend(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw new Error(error.message);
}

/** Get all accepted friends for the current user. */
export async function getFriends(): Promise<FriendProfile[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id, requester_id, addressee_id, status, created_at, updated_at,
      requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_url),
      addressee:profiles!friendships_addressee_id_fkey(id, display_name, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const friendship: Friendship = {
      id: row.id,
      requester_id: row.requester_id,
      addressee_id: row.addressee_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    // Return the OTHER person's profile
    const isRequester = row.requester_id === uid;
    const other = isRequester
      ? (Array.isArray(row.addressee) ? row.addressee[0] : row.addressee)
      : (Array.isArray(row.requester) ? row.requester[0] : row.requester);

    return {
      id: (other as { id: string }).id,
      display_name: (other as { display_name: string | null }).display_name ?? "Unknown",
      avatar_url: (other as { avatar_url: string | null }).avatar_url ?? null,
      friendship,
    } satisfies FriendProfile;
  });
}

/** Get pending friend requests addressed TO the current user. */
export async function getPendingRequests(): Promise<FriendProfile[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from("friendships")
    .select(`
      id, requester_id, addressee_id, status, created_at, updated_at,
      requester:profiles!friendships_requester_id_fkey(id, display_name, avatar_url)
    `)
    .eq("addressee_id", uid)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const friendship: Friendship = {
      id: row.id,
      requester_id: row.requester_id,
      addressee_id: row.addressee_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    const other = Array.isArray(row.requester) ? row.requester[0] : row.requester;
    return {
      id: (other as { id: string }).id,
      display_name: (other as { display_name: string | null }).display_name ?? "Unknown",
      avatar_url: (other as { avatar_url: string | null }).avatar_url ?? null,
      friendship,
    } satisfies FriendProfile;
  });
}

// ── Badges ───────────────────────────────────────────────────────────────────

/**
 * Award a badge to the current user.
 * Returns `true` if the badge was newly granted, `false` if they already had it.
 * Silently returns `false` if the user is not signed in.
 */
export async function awardBadge(badgeId: BadgeId): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;

  const { error } = await supabase
    .from("user_badges")
    .insert({ user_id: uid, badge_id: badgeId });

  if (error) {
    // 23505 = unique_violation — badge already earned
    if (error.code === "23505" || error.message.includes("duplicate")) return false;
    console.error("[awardBadge]", error.message);
    return false;
  }

  return true;
}

/** Fetch all badges earned by a given user. */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as UserBadge[];
}
