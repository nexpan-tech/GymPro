// Phase M — shared celebration catalogue (web). Mirrored on mobile so both
// platforms fire identical "delight moments" with consistent copy + emoji.

export type CelebrationType =
  | "WORKOUT"
  | "GOAL"
  | "STREAK_7"
  | "STREAK_30"
  | "STREAK_90"
  | "RENEWAL"
  | "TOP3"
  | "LEVEL_UP";

export interface CelebrationDef {
  emoji: string;
  title: string;
  message: string;
}

export const CELEBRATIONS: Record<CelebrationType, CelebrationDef> = {
  WORKOUT: { emoji: "🔥", title: "Workout Complete", message: "You completed today's workout. That's how progress is built." },
  GOAL: { emoji: "🏆", title: "Goal Achieved", message: "You hit your goal — time to set the next one." },
  STREAK_7: { emoji: "⚡", title: "Momentum Building", message: "7-day streak! You're forming a real habit." },
  STREAK_30: { emoji: "🚀", title: "Consistency Champion", message: "30-day streak — most people never get here." },
  STREAK_90: { emoji: "👑", title: "Elite Discipline", message: "90-day streak. This is who you are now." },
  RENEWAL: { emoji: "🎉", title: "Membership Renewed", message: "You're all set. Keep the momentum going." },
  TOP3: { emoji: "🥇", title: "Top Performer", message: "You're in your gym's top 3 this month!" },
  LEVEL_UP: { emoji: "⭐", title: "Level Up", message: "You leveled up — your effort is paying off." },
};

/** Map a streak length to its milestone celebration, if it just crossed one. */
export function streakMilestone(streak: number): CelebrationType | null {
  if (streak === 90) return "STREAK_90";
  if (streak === 30) return "STREAK_30";
  if (streak === 7) return "STREAK_7";
  return null;
}
