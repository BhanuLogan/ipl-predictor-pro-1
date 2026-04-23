import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LeaderboardEntry } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(profilePic: string | undefined | null, username: string) {
  if (profilePic) return profilePic;
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${username}&backgroundColor=f5f5f5`;
}

/** Rank assignment (ordinal ranking: 1, 2, 3...) */
export function assignRanks(entries: LeaderboardEntry[]): (LeaderboardEntry & { rank: number })[] {
  return entries.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
