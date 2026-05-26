import type { BadgeDefinition, BadgeId } from "@/types/social";

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  first_swipe: {
    id: "first_swipe",
    label: "First Swipe",
    description: "Made your very first swipe on Cindr.",
    icon: "👆",
  },
  swipe_10: {
    id: "swipe_10",
    label: "Getting Warmed Up",
    description: "Swiped 10 movies.",
    icon: "🔥",
  },
  swipe_100: {
    id: "swipe_100",
    label: "Centurion",
    description: "Swiped 100 movies. Committed.",
    icon: "💯",
  },
  swipe_500: {
    id: "swipe_500",
    label: "Obsessed",
    description: "500 swipes deep. You live here now.",
    icon: "🎬",
  },
  first_like: {
    id: "first_like",
    label: "First Like",
    description: "Liked your first movie.",
    icon: "❤️",
  },
  liked_10: {
    id: "liked_10",
    label: "Taste Maker",
    description: "Liked 10 movies. Your watchlist is growing.",
    icon: "🎞️",
  },
  genre_explorer: {
    id: "genre_explorer",
    label: "Genre Explorer",
    description: "Liked movies across 3 or more different genres.",
    icon: "🧭",
  },
  hidden_gem: {
    id: "hidden_gem",
    label: "Hidden Gem Hunter",
    description: "Liked a movie with fewer than 1,000 votes — a true find.",
    icon: "💎",
  },
  joined_community: {
    id: "joined_community",
    label: "Community Member",
    description: "Joined your first community.",
    icon: "👥",
  },
  first_friend: {
    id: "first_friend",
    label: "First Friend",
    description: "Made your first friend on Cindr.",
    icon: "🤝",
  },
};

/** Milestone swipe counts that trigger badge checks */
export const SWIPE_BADGE_MILESTONES: Array<{ count: number; badgeId: BadgeId }> = [
  { count: 1,   badgeId: "first_swipe" },
  { count: 10,  badgeId: "swipe_10" },
  { count: 100, badgeId: "swipe_100" },
  { count: 500, badgeId: "swipe_500" },
];
