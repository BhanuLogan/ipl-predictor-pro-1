// IPL 2026 Teams
export const IPL_TEAMS: Record<string, { name: string; short: string; color: string; textColor: string }> = {
  CSK: { name: "Chennai Super Kings", short: "CSK", color: "#C47D00", textColor: "#000" },
  MI:  { name: "Mumbai Indians", short: "MI", color: "#004BA0", textColor: "#fff" },
  RCB: { name: "Royal Challengers Bengaluru", short: "RCB", color: "#C8102E", textColor: "#fff" },
  KKR: { name: "Kolkata Knight Riders", short: "KKR", color: "#3A225D", textColor: "#fff" },
  DC:  { name: "Delhi Capitals", short: "DC", color: "#004C97", textColor: "#fff" },
  PBKS:{ name: "Punjab Kings", short: "PBKS", color: "#AA0000", textColor: "#fff" },
  RR:  { name: "Rajasthan Royals", short: "RR", color: "#EA1F8B", textColor: "#fff" },
  SRH: { name: "Sunrisers Hyderabad", short: "SRH", color: "#FF6B00", textColor: "#000" },
  GT:  { name: "Gujarat Titans", short: "GT", color: "#1C3C6A", textColor: "#fff" },
  LSG: { name: "Lucknow Super Giants", short: "LSG", color: "#A72B2A", textColor: "#fff" },
};

export interface Match {
  id: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  t1full: string;
  t2full: string;
  venue: string;
}

// IPL 2026 Phase 1 confirmed schedule
export const IPL_SCHEDULE: Match[] = [
  { id: "m01", date: "2026-03-28", time: "19:30", team1: "RCB", team2: "SRH", t1full: "Royal Challengers Bengaluru", t2full: "Sunrisers Hyderabad", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m02", date: "2026-03-29", time: "19:30", team1: "MI", team2: "KKR", t1full: "Mumbai Indians", t2full: "Kolkata Knight Riders", venue: "Wankhede Stadium, Mumbai" },
  { id: "m03", date: "2026-03-30", time: "19:30", team1: "RR", team2: "CSK", t1full: "Rajasthan Royals", t2full: "Chennai Super Kings", venue: "Sawai Mansingh Stadium, Jaipur" },
  { id: "m04", date: "2026-03-31", time: "19:30", team1: "PBKS", team2: "GT", t1full: "Punjab Kings", t2full: "Gujarat Titans", venue: "Maharaja Yadavindra Singh Stadium, Mullanpur" },
  { id: "m05", date: "2026-04-01", time: "19:30", team1: "LSG", team2: "DC", t1full: "Lucknow Super Giants", t2full: "Delhi Capitals", venue: "Ekana Cricket Stadium, Lucknow" },
  { id: "m06", date: "2026-04-02", time: "19:30", team1: "SRH", team2: "KKR", t1full: "Sunrisers Hyderabad", t2full: "Kolkata Knight Riders", venue: "Rajiv Gandhi Intl. Stadium, Hyderabad" },
  { id: "m07", date: "2026-04-03", time: "19:30", team1: "PBKS", team2: "CSK", t1full: "Punjab Kings", t2full: "Chennai Super Kings", venue: "Maharaja Yadavindra Singh Stadium, Mullanpur" },
  { id: "m08", date: "2026-04-04", time: "15:30", team1: "DC", team2: "MI", t1full: "Delhi Capitals", t2full: "Mumbai Indians", venue: "Arun Jaitley Stadium, Delhi" },
  { id: "m09", date: "2026-04-04", time: "19:30", team1: "GT", team2: "RR", t1full: "Gujarat Titans", t2full: "Rajasthan Royals", venue: "Narendra Modi Stadium, Ahmedabad" },
  { id: "m10", date: "2026-04-05", time: "15:30", team1: "RCB", team2: "CSK", t1full: "Royal Challengers Bengaluru", t2full: "Chennai Super Kings", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m11", date: "2026-04-05", time: "19:30", team1: "SRH", team2: "LSG", t1full: "Sunrisers Hyderabad", t2full: "Lucknow Super Giants", venue: "Rajiv Gandhi Intl. Stadium, Hyderabad" },
  { id: "m12", date: "2026-04-06", time: "19:30", team1: "KKR", team2: "PBKS", t1full: "Kolkata Knight Riders", t2full: "Punjab Kings", venue: "Eden Gardens, Kolkata" },
  { id: "m13", date: "2026-04-07", time: "19:30", team1: "RR", team2: "MI", t1full: "Rajasthan Royals", t2full: "Mumbai Indians", venue: "Sawai Mansingh Stadium, Jaipur" },
  { id: "m14", date: "2026-04-08", time: "19:30", team1: "DC", team2: "GT", t1full: "Delhi Capitals", t2full: "Gujarat Titans", venue: "Arun Jaitley Stadium, Delhi" },
  { id: "m15", date: "2026-04-09", time: "19:30", team1: "KKR", team2: "LSG", t1full: "Kolkata Knight Riders", t2full: "Lucknow Super Giants", venue: "Eden Gardens, Kolkata" },
  { id: "m16", date: "2026-04-10", time: "19:30", team1: "RCB", team2: "RR", t1full: "Royal Challengers Bengaluru", t2full: "Rajasthan Royals", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m17", date: "2026-04-11", time: "15:30", team1: "CSK", team2: "DC", t1full: "Chennai Super Kings", t2full: "Delhi Capitals", venue: "MA Chidambaram Stadium, Chennai" },
  { id: "m18", date: "2026-04-11", time: "19:30", team1: "SRH", team2: "PBKS", t1full: "Sunrisers Hyderabad", t2full: "Punjab Kings", venue: "Rajiv Gandhi Intl. Stadium, Hyderabad" },
  { id: "m19", date: "2026-04-12", time: "15:30", team1: "RCB", team2: "MI", t1full: "Royal Challengers Bengaluru", t2full: "Mumbai Indians", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { id: "m20", date: "2026-04-12", time: "19:30", team1: "GT", team2: "LSG", t1full: "Gujarat Titans", t2full: "Lucknow Super Giants", venue: "Narendra Modi Stadium, Ahmedabad" },
];

// Poll open logic: a match poll is open if it hasn't started and (it's the first match OR previous match has a result)
export function getPollOpenMatches(results: Record<string, string>): Match[] {
  const now = new Date();
  const open: Match[] = [];
  for (let i = 0; i < IPL_SCHEDULE.length; i++) {
    const m = IPL_SCHEDULE[i];
    const matchStart = new Date(`${m.date}T${m.time}:00+05:30`);
    if (results[m.id]) continue;
    if (now >= matchStart) continue;
    if (i === 0) { open.push(m); continue; }
    const prevId = IPL_SCHEDULE[i - 1].id;
    if (results[prevId]) open.push(m);
  }
  return open;
}

export function formatMatchDate(date: string, time?: string): string {
  const base = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return time ? `${base} · ${time} IST` : base;
}
