// Social features: Friends, Communities, Badges

// ── Friendships ──────────────────────────────────────────────────────────────

export type FriendStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  friendship: Friendship;
}

// ── Communities ──────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  genre_tags: string[];
  accent_color: string;
  member_count: number;
  /** Populated client-side after join-status check */
  is_member?: boolean;
}

export interface CommunityMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  joined_at: string;
  /** Populated client-side after friendship-status check */
  friendship_status?: FriendStatus | null;
}

// ── Badges ───────────────────────────────────────────────────────────────────

export type BadgeId =
  | 'first_swipe'
  | 'swipe_10'
  | 'swipe_100'
  | 'swipe_500'
  | 'first_like'
  | 'liked_10'
  | 'genre_explorer'
  | 'hidden_gem'
  | 'joined_community'
  | 'first_friend';

export interface BadgeDefinition {
  id: BadgeId;
  label: string;
  description: string;
  icon: string; // emoji or icon name
}

export interface UserBadge {
  user_id: string;
  badge_id: BadgeId;
  earned_at: string;
}
