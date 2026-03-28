const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("VITE_API_URL is required in the frontend .env file");
}

function getToken(): string | null {
  return localStorage.getItem("ipl_token");
}

function setToken(token: string) {
  localStorage.setItem("ipl_token", token);
}

function clearToken() {
  localStorage.removeItem("ipl_token");
  localStorage.removeItem("ipl_user");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  profile_pic?: string;
}

export interface LeaderboardEntry {
  username: string;
  profile_pic?: string;
  points: number;
  correct: number;
  total: number;
  voted: number;
}

export interface Room {
  id: number;
  name: string;
  invite_code: string;
  member_count?: number;
  members?: string[];
  created_by?: number;
  created_by_username?: string;
}

export const api = {
  // Auth — username + password only
  async register(username: string, password: string) {
    const data = await apiFetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    localStorage.setItem("ipl_user", JSON.stringify(data.user));
    return data.user as User;
  },

  async login(username: string, password: string) {
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    localStorage.setItem("ipl_user", JSON.stringify(data.user));
    return data.user as User;
  },

  logout() {
    clearToken();
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem("ipl_user");
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn(): boolean {
    return !!getToken();
  },

  async me(): Promise<User> {
    const user = await apiFetch("/api/me");
    localStorage.setItem("ipl_user", JSON.stringify(user));
    return user;
  },

  // Admin
  async unlockAdmin(password: string) {
    const data = await apiFetch("/api/admin/unlock", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    setToken(data.token);
    const user = api.getStoredUser();
    if (user) {
      user.is_admin = true;
      localStorage.setItem("ipl_user", JSON.stringify(user));
    }
    return data;
  },

  // Votes — returns counts only (no usernames revealed)
  async getVotes(): Promise<Record<string, Record<string, string>>> {
    return apiFetch("/api/votes");
  },

  // Get vote counts (anonymous)
  async getVoteCounts(): Promise<Record<string, Record<string, number>>> {
    return apiFetch("/api/vote-counts");
  },

  async vote(matchId: string, prediction: string) {
    return apiFetch("/api/vote", {
      method: "POST",
      body: JSON.stringify({ matchId, prediction }),
    });
  },

  // Results
  async getResults(): Promise<Record<string, string>> {
    return apiFetch("/api/results");
  },

  async setResult(matchId: string, winner: string | null) {
    return apiFetch("/api/result", {
      method: "POST",
      body: JSON.stringify({ matchId, winner: winner || "" }),
    });
  },

  // Admin: alter a user's vote
  async adminSetVote(matchId: string, username: string, prediction: string) {
    return apiFetch("/api/admin/vote", {
      method: "POST",
      body: JSON.stringify({ matchId, username, prediction }),
    });
  },

  // Admin: delete a user's vote
  async adminDeleteVote(matchId: string, username: string) {
    return apiFetch("/api/admin/delete-vote", { method: "POST", body: JSON.stringify({ matchId, username }) });
  },

  async updateProfile(data: { username?: string; password?: string; profile_pic?: string | null }) {
    const res = await apiFetch("/api/me", { method: "PUT", body: JSON.stringify(data) });
    if (res.token) setToken(res.token);
    if (res.user) localStorage.setItem("ipl_user", JSON.stringify(res.user));
    return res;
  },

  // Admin: reset all data
  async adminReset() {
    return apiFetch("/api/admin/reset", { method: "POST" });
  },

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return apiFetch("/api/leaderboard");
  },

  // Rooms
  async createRoom(name: string): Promise<Room> {
    return apiFetch("/api/rooms", { method: "POST", body: JSON.stringify({ name }) });
  },

  async joinRoom(inviteCode: string): Promise<{ room: Room }> {
    return apiFetch("/api/rooms/join", { method: "POST", body: JSON.stringify({ inviteCode }) });
  },

  async getMyRooms(): Promise<Room[]> {
    return apiFetch("/api/rooms/mine");
  },

  async getRoom(id: number): Promise<Room> {
    return apiFetch(`/api/rooms/${id}`);
  },

  async getRoomLeaderboard(id: number): Promise<LeaderboardEntry[]> {
    return apiFetch(`/api/rooms/${id}/leaderboard`);
  },

  async deleteRoom(id: number): Promise<void> {
    return apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
  },

  async getAllRoomsAdmin(): Promise<Room[]> {
    return apiFetch("/api/admin/rooms");
  },
};
