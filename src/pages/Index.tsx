import { useState, useCallback } from "react";
import Header from "@/components/Header";
import JoinModal from "@/components/JoinModal";
import MatchPoll from "@/components/MatchPoll";
import { getUsername, getNextMatch, IPL_SCHEDULE, getResults } from "@/lib/data";

const Index = () => {
  const [username, setUser] = useState(getUsername());
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(v => v + 1), []);

  const nextMatch = getNextMatch();
  const results = getResults();

  // Show upcoming/active matches (next 3 unfinished + completed today)
  const today = new Date().toISOString().split("T")[0];
  const upcomingMatches = IPL_SCHEDULE.filter(m => m.date >= today && !results[m.id]).slice(0, 3);
  const todayCompleted = IPL_SCHEDULE.filter(m => m.date === today && results[m.id]);

  if (!username) {
    return <JoinModal onJoin={() => setUser(getUsername())} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => { localStorage.clear(); setUser(null); }} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            TODAY'S MATCH
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pick your winner & earn points! 🎯
          </p>
        </div>

        {/* Today's completed matches */}
        {todayCompleted.map(match => (
          <div key={match.id} className="mb-4">
            <MatchPoll match={match} onVote={refresh} />
          </div>
        ))}

        {/* Upcoming matches */}
        {upcomingMatches.length > 0 ? (
          <div className="space-y-4">
            {upcomingMatches.map((match, i) => (
              <div key={match.id}>
                {i > 0 && (
                  <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Upcoming
                  </p>
                )}
                <MatchPoll match={match} onVote={refresh} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-card border border-border p-12 text-center">
            <span className="text-5xl">🏏</span>
            <h3 className="mt-4 font-display text-3xl text-foreground">
              No Matches Today
            </h3>
            <p className="mt-2 text-muted-foreground">
              {nextMatch
                ? `Next match: ${new Date(nextMatch.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`
                : "The IPL 2026 season has concluded!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
