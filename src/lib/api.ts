const API_URL = "https://ipl-predictor-pro-2.onrender.com";

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
  email: string;
  username: string;
  is_admin: boolean;
}

export interface LeaderboardEntry {
  username: string;
  points: number;
  correct: number;
  total: number;
  voted: number;
}

export const api = {
  // Auth
  async register(email: string, username: string, password: string) {
    const data = await apiFetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });
    setToken(data.token);
    localStorage.setItem("ipl_user", JSON.stringify(data.user));
    return data.user as User;
  },

  async login(email: string, password: string) {
    const data = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
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

  // Votes
  async getVotes(): Promise<Record<string, Record<string, string>>> {
    return apiFetch("/api/votes");
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

  // Leaderboard
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return apiFetch("/api/leaderboard");
  },
};
