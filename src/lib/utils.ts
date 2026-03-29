import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getAvatarUrl(profilePic: string | undefined | null, username: string) {
  if (profilePic) return profilePic;
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${username}&backgroundColor=f5f5f5`;
}
