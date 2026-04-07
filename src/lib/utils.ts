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

/** Rank assignment (tie = same rank, next is gap-ranked) */
export function assignRanks(entries: LeaderboardEntry[]): (LeaderboardEntry & { rank: number })[] {
  return entries.map((entry, i, arr) => {
    const rank = i === 0 ? 1 : arr[i - 1].points === entry.points
      ? (arr[i - 1] as any)._rank
      : i + 1;
    (entry as any)._rank = rank;
    return { ...entry, rank };
  });
}
