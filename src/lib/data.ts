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
  venue: string;
}

// IPL 2026 Full schedule (70 matches)
export const IPL_SCHEDULE: Match[] = [
  {"id":"m01","date":"2026-03-28","time":"19:30","team1":"RCB","team2":"SRH","venue":"M. Chinnaswamy Stadium, Bengaluru"},
  {"id":"m02","date":"2026-03-29","time":"19:30","team1":"MI","team2":"KKR","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m03","date":"2026-03-30","time":"19:30","team1":"RR","team2":"CSK","venue":"Barsapara Cricket Stadium, Guwahati"},
  {"id":"m04","date":"2026-03-31","time":"19:30","team1":"PBKS","team2":"GT","venue":"Maharaja Yadavindra Singh Stadium, New Chandigarh"},
  {"id":"m05","date":"2026-04-01","time":"19:30","team1":"LSG","team2":"DC","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m06","date":"2026-04-02","time":"19:30","team1":"KKR","team2":"SRH","venue":"Eden Gardens, Kolkata"},
  {"id":"m07","date":"2026-04-03","time":"19:30","team1":"CSK","team2":"PBKS","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m08","date":"2026-04-04","time":"15:30","team1":"DC","team2":"MI","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m09","date":"2026-04-04","time":"19:30","team1":"GT","team2":"RR","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m10","date":"2026-04-05","time":"15:30","team1":"SRH","team2":"LSG","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m11","date":"2026-04-05","time":"19:30","team1":"RCB","team2":"CSK","venue":"M. Chinnaswamy Stadium, Bengaluru"},
  {"id":"m12","date":"2026-04-06","time":"19:30","team1":"KKR","team2":"PBKS","venue":"Eden Gardens, Kolkata"},
  {"id":"m13","date":"2026-04-07","time":"19:30","team1":"RR","team2":"MI","venue":"Barsapara Cricket Stadium, Guwahati"},
  {"id":"m14","date":"2026-04-08","time":"19:30","team1":"DC","team2":"GT","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m15","date":"2026-04-09","time":"19:30","team1":"KKR","team2":"LSG","venue":"Eden Gardens, Kolkata"},
  {"id":"m16","date":"2026-04-10","time":"19:30","team1":"RR","team2":"RCB","venue":"Barsapara Cricket Stadium, Guwahati"},
  {"id":"m17","date":"2026-04-11","time":"15:30","team1":"PBKS","team2":"SRH","venue":"Maharaja Yadavindra Singh Stadium, New Chandigarh"},
  {"id":"m18","date":"2026-04-11","time":"19:30","team1":"CSK","team2":"DC","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m19","date":"2026-04-12","time":"15:30","team1":"LSG","team2":"GT","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m20","date":"2026-04-12","time":"19:30","team1":"MI","team2":"RCB","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m21","date":"2026-04-13","time":"19:30","team1":"SRH","team2":"RR","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m22","date":"2026-04-14","time":"19:30","team1":"CSK","team2":"KKR","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m23","date":"2026-04-15","time":"19:30","team1":"RCB","team2":"LSG","venue":"M. Chinnaswamy Stadium, Bengaluru"},
  {"id":"m24","date":"2026-04-16","time":"19:30","team1":"MI","team2":"PBKS","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m25","date":"2026-04-17","time":"19:30","team1":"GT","team2":"KKR","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m26","date":"2026-04-18","time":"15:30","team1":"RCB","team2":"DC","venue":"M. Chinnaswamy Stadium, Bengaluru"},
  {"id":"m27","date":"2026-04-18","time":"19:30","team1":"SRH","team2":"CSK","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m28","date":"2026-04-19","time":"15:30","team1":"KKR","team2":"RR","venue":"Eden Gardens, Kolkata"},
  {"id":"m29","date":"2026-04-19","time":"19:30","team1":"PBKS","team2":"LSG","venue":"Maharaja Yadavindra Singh Stadium, New Chandigarh"},
  {"id":"m30","date":"2026-04-20","time":"19:30","team1":"GT","team2":"MI","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m31","date":"2026-04-21","time":"19:30","team1":"SRH","team2":"DC","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m32","date":"2026-04-22","time":"19:30","team1":"LSG","team2":"RR","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m33","date":"2026-04-23","time":"19:30","team1":"MI","team2":"CSK","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m34","date":"2026-04-24","time":"19:30","team1":"RCB","team2":"GT","venue":"M. Chinnaswamy Stadium, Bengaluru"},
  {"id":"m35","date":"2026-04-25","time":"15:30","team1":"DC","team2":"PBKS","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m36","date":"2026-04-25","time":"19:30","team1":"RR","team2":"SRH","venue":"Sawai Mansingh Stadium, Jaipur"},
  {"id":"m37","date":"2026-04-26","time":"15:30","team1":"GT","team2":"CSK","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m38","date":"2026-04-26","time":"19:30","team1":"LSG","team2":"KKR","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m39","date":"2026-04-27","time":"19:30","team1":"DC","team2":"RCB","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m40","date":"2026-04-28","time":"19:30","team1":"PBKS","team2":"RR","venue":"Maharaja Yadavindra Singh Stadium, New Chandigarh"},
  {"id":"m41","date":"2026-04-29","time":"19:30","team1":"MI","team2":"SRH","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m42","date":"2026-04-30","time":"19:30","team1":"GT","team2":"RCB","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m43","date":"2026-05-01","time":"19:30","team1":"RR","team2":"DC","venue":"Sawai Mansingh Stadium, Jaipur"},
  {"id":"m44","date":"2026-05-02","time":"19:30","team1":"CSK","team2":"MI","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m45","date":"2026-05-03","time":"15:30","team1":"SRH","team2":"KKR","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m46","date":"2026-05-03","time":"19:30","team1":"GT","team2":"PBKS","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m47","date":"2026-05-04","time":"19:30","team1":"MI","team2":"LSG","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m48","date":"2026-05-05","time":"19:30","team1":"DC","team2":"CSK","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m49","date":"2026-05-06","time":"19:30","team1":"SRH","team2":"PBKS","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m50","date":"2026-05-07","time":"19:30","team1":"LSG","team2":"RCB","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m51","date":"2026-05-08","time":"19:30","team1":"DC","team2":"KKR","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m52","date":"2026-05-09","time":"19:30","team1":"RR","team2":"GT","venue":"Sawai Mansingh Stadium, Jaipur"},
  {"id":"m53","date":"2026-05-10","time":"15:30","team1":"CSK","team2":"LSG","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m54","date":"2026-05-10","time":"19:30","team1":"RCB","team2":"MI","venue":"Shaheed Veer Narayan Singh Stadium, Raipur"},
  {"id":"m55","date":"2026-05-11","time":"19:30","team1":"PBKS","team2":"DC","venue":"HPCA Stadium, Dharamshala"},
  {"id":"m56","date":"2026-05-12","time":"19:30","team1":"GT","team2":"SRH","venue":"Narendra Modi Stadium, Ahmedabad"},
  {"id":"m57","date":"2026-05-13","time":"19:30","team1":"RCB","team2":"KKR","venue":"Shaheed Veer Narayan Singh Stadium, Raipur"},
  {"id":"m58","date":"2026-05-14","time":"19:30","team1":"PBKS","team2":"MI","venue":"HPCA Stadium, Dharamshala"},
  {"id":"m59","date":"2026-05-15","time":"19:30","team1":"LSG","team2":"CSK","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m60","date":"2026-05-16","time":"19:30","team1":"KKR","team2":"GT","venue":"Eden Gardens, Kolkata"},
  {"id":"m61","date":"2026-05-17","time":"15:30","team1":"PBKS","team2":"RCB","venue":"HPCA Stadium, Dharamshala"},
  {"id":"m62","date":"2026-05-17","time":"19:30","team1":"DC","team2":"RR","venue":"Arun Jaitley Stadium, Delhi"},
  {"id":"m63","date":"2026-05-18","time":"19:30","team1":"CSK","team2":"SRH","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m64","date":"2026-05-19","time":"19:30","team1":"RR","team2":"LSG","venue":"Sawai Mansingh Stadium, Jaipur"},
  {"id":"m65","date":"2026-05-20","time":"19:30","team1":"KKR","team2":"MI","venue":"Eden Gardens, Kolkata"},
  {"id":"m66","date":"2026-05-21","time":"19:30","team1":"CSK","team2":"GT","venue":"MA Chidambaram Stadium, Chennai"},
  {"id":"m67","date":"2026-05-22","time":"19:30","team1":"SRH","team2":"RCB","venue":"Rajiv Gandhi Intl. Stadium, Hyderabad"},
  {"id":"m68","date":"2026-05-23","time":"19:30","team1":"LSG","team2":"PBKS","venue":"Ekana Cricket Stadium, Lucknow"},
  {"id":"m69","date":"2026-05-24","time":"15:30","team1":"MI","team2":"RR","venue":"Wankhede Stadium, Mumbai"},
  {"id":"m70","date":"2026-05-24","time":"19:30","team1":"KKR","team2":"DC","venue":"Eden Gardens, Kolkata"},
];

// Poll open logic: match poll is open if before match time and previous match has result (or first match)
export function getPollOpenMatches(results: Record<string, string>): Match[] {
  const open: Match[] = [];
  for (let i = 0; i < IPL_SCHEDULE.length; i++) {
    const m = IPL_SCHEDULE[i];
    if (results[m.id]) continue;
    if (i === 0) { open.push(m); continue; }
    const prevId = IPL_SCHEDULE[i - 1].id;
    if (results[prevId]) open.push(m);
  }
  return open;
}

// Check if voting is locked (after match start time on match day)
export function isVotingLocked(match: Match): boolean {
  const now = new Date();
  const timeStr = match.time || "19:30";
  const lockTime = new Date(`${match.date}T${timeStr}:00+05:30`);
  return now >= lockTime;
}

export function formatMatchDate(date: string, time?: string): string {
  const base = new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return time ? `${base} · ${time} IST` : base;
}
