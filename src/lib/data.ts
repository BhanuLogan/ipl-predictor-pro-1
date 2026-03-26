// IPL 2026 Teams
export const IPL_TEAMS: Record<string, { name: string; short: string; color: string; textColor: string }> = {
  CSK: { name: "Chennai Super Kings", short: "CSK", color: "#FCCA06", textColor: "#000" },
  MI: { name: "Mumbai Indians", short: "MI", color: "#004BA0", textColor: "#fff" },
  RCB: { name: "Royal Challengers Bengaluru", short: "RCB", color: "#D4213D", textColor: "#fff" },
  KKR: { name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", textColor: "#fff" },
  DC: { name: "Delhi Capitals", short: "DC", color: "#17479E", textColor: "#fff" },
  PBKS: { name: "Punjab Kings", short: "PBKS", color: "#DD1F2D", textColor: "#fff" },
  RR: { name: "Rajasthan Royals", short: "RR", color: "#EA1A85", textColor: "#fff" },
  SRH: { name: "Sunrisers Hyderabad", short: "SRH", color: "#F7A721", textColor: "#000" },
  GT: { name: "Gujarat Titans", short: "GT", color: "#1C1C2B", textColor: "#fff" },
  LSG: { name: "Lucknow Super Giants", short: "LSG", color: "#A72056", textColor: "#fff" },
};

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  team1: string; // team key
  team2: string;
  venue: string;
  winner?: string | "NR" | "DRAW"; // team key, "NR" for no result, "DRAW"
}

export interface Vote {
  matchId: string;
  username: string;
  prediction: string; // team key
}

export interface UserScore {
  username: string;
  points: number;
  correct: number;
  total: number;
}

// Generate a sample IPL 2026 schedule (March 28 - May 25)
export const IPL_SCHEDULE: Match[] = [
  { id: "m1", date: "2026-03-28", team1: "KKR", team2: "MI", venue: "Eden Gardens, Kolkata" },
  { id: "m2", date: "2026-03-29", team1: "CSK", team2: "RCB", venue: "MA Chidambaram Stadium, Chennai" },
  { id: "m3", date: "2026-03-30", team1: "DC", team2: "PBKS", venue: "Arun Jaitley Stadium, Delhi" },
  { id: "m4", date: "2026-03-31", team1: "GT", team2: "LSG", venue: "Narendra Modi Stadium, Ahmedabad" },
  { id: "m5", date: "2026-04-01", team1: "RR", team2: "SRH", venue: "Sawai Mansingh Stadium, Jaipur" },
  { id: "m6", date: "2026-04-02", team1: "MI", team2: "CSK", venue: "Wankhede Stadium, Mumbai" },
  { id: "m7", date: "2026-04-03", team1: "RCB", team2: "KKR", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m8", date: "2026-04-04", team1: "PBKS", team2: "GT", venue: "PCA Stadium, Mohali" },
  { id: "m9", date: "2026-04-05", team1: "SRH", team2: "DC", venue: "Rajiv Gandhi Stadium, Hyderabad" },
  { id: "m10", date: "2026-04-06", team1: "LSG", team2: "RR", venue: "BRSABV Ekana Stadium, Lucknow" },
  { id: "m11", date: "2026-04-07", team1: "CSK", team2: "MI", venue: "MA Chidambaram Stadium, Chennai" },
  { id: "m12", date: "2026-04-08", team1: "KKR", team2: "DC", venue: "Eden Gardens, Kolkata" },
  { id: "m13", date: "2026-04-09", team1: "RCB", team2: "RR", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m14", date: "2026-04-10", team1: "GT", team2: "SRH", venue: "Narendra Modi Stadium, Ahmedabad" },
  { id: "m15", date: "2026-04-11", team1: "PBKS", team2: "LSG", venue: "PCA Stadium, Mohali" },
  { id: "m16", date: "2026-04-12", team1: "MI", team2: "RCB", venue: "Wankhede Stadium, Mumbai" },
  { id: "m17", date: "2026-04-13", team1: "DC", team2: "CSK", venue: "Arun Jaitley Stadium, Delhi" },
  { id: "m18", date: "2026-04-14", team1: "SRH", team2: "KKR", venue: "Rajiv Gandhi Stadium, Hyderabad" },
  { id: "m19", date: "2026-04-15", team1: "RR", team2: "GT", venue: "Sawai Mansingh Stadium, Jaipur" },
  { id: "m20", date: "2026-04-16", team1: "LSG", team2: "PBKS", venue: "BRSABV Ekana Stadium, Lucknow" },
];

// localStorage helpers
const STORAGE_KEYS = {
  username: "ipl_poll_username",
  votes: "ipl_poll_votes",
  results: "ipl_poll_results",
  users: "ipl_poll_users",
};

export function getUsername(): string | null {
  return localStorage.getItem(STORAGE_KEYS.username);
}

export function setUsername(name: string) {
  localStorage.setItem(STORAGE_KEYS.username, name);
  const users = getUsers();
  if (!users.includes(name)) {
    users.push(name);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }
}

export function getUsers(): string[] {
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  return raw ? JSON.parse(raw) : [];
}

export function getVotes(): Vote[] {
  const raw = localStorage.getItem(STORAGE_KEYS.votes);
  return raw ? JSON.parse(raw) : [];
}

export function addVote(vote: Vote) {
  const votes = getVotes();
  const existing = votes.findIndex(v => v.matchId === vote.matchId && v.username === vote.username);
  if (existing >= 0) {
    votes[existing] = vote;
  } else {
    votes.push(vote);
  }
  localStorage.setItem(STORAGE_KEYS.votes, JSON.stringify(votes));
}

export function getResults(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEYS.results);
  return raw ? JSON.parse(raw) : {};
}

export function setResult(matchId: string, winner: string) {
  const results = getResults();
  results[matchId] = winner;
  localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(results));
}

export function getLeaderboard(): UserScore[] {
  const users = getUsers();
  const votes = getVotes();
  const results = getResults();

  return users.map(username => {
    let points = 0;
    let correct = 0;
    let total = 0;

    votes
      .filter(v => v.username === username)
      .forEach(vote => {
        const result = results[vote.matchId];
        if (result) {
          total++;
          if (result === "NR" || result === "DRAW") {
            points += 1;
          } else if (vote.prediction === result) {
            points += 2;
            correct++;
          }
        }
      });

    return { username, points, correct, total };
  }).sort((a, b) => b.points - a.points || b.correct - a.correct);
}

export function getTodayMatch(): Match | undefined {
  const today = new Date().toISOString().split("T")[0];
  return IPL_SCHEDULE.find(m => m.date === today);
}

export function getNextMatch(): Match | undefined {
  const today = new Date().toISOString().split("T")[0];
  return IPL_SCHEDULE.find(m => m.date >= today);
}

export function getUserVoteForMatch(matchId: string, username: string): Vote | undefined {
  return getVotes().find(v => v.matchId === matchId && v.username === username);
}

export function getMatchVoteCounts(matchId: string): Record<string, number> {
  const votes = getVotes().filter(v => v.matchId === matchId);
  const counts: Record<string, number> = {};
  votes.forEach(v => {
    counts[v.prediction] = (counts[v.prediction] || 0) + 1;
  });
  return counts;
}
