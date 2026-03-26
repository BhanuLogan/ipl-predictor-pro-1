import { useState } from "react";
import Header from "@/components/Header";
import {
  IPL_SCHEDULE,
  IPL_TEAMS,
  getResults,
  setResult,
  getUsername,
  getMatchVoteCounts,
} from "@/lib/data";
import { Check, X, CloudRain } from "lucide-react";

const Admin = () => {
  const [results, setResults] = useState(getResults());
  const [, setUser] = useState(getUsername());

  const handleSetWinner = (matchId: string, winner: string) => {
    setResult(matchId, winner);
    setResults(getResults());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => { localStorage.clear(); setUser(null); window.location.href = "/"; }} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            ADMIN PANEL
          </h2>
          <p className="mt-2 text-muted-foreground">
            Set match results to update the leaderboard 🛡️
          </p>
        </div>

        <div className="space-y-3">
          {IPL_SCHEDULE.map((match) => {
            const result = results[match.id];
            const team1 = IPL_TEAMS[match.team1];
            const team2 = IPL_TEAMS[match.team2];
            const voteCounts = getMatchVoteCounts(match.id);

            return (
              <div
                key={match.id}
                className={`rounded-xl border p-4 ${
                  result ? "border-secondary/30 bg-secondary/5" : "border-border bg-gradient-card"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">{formatDate(match.date)}</span>
                  {result && (
                    <button
                      onClick={() => handleSetWinner(match.id, "")}
                      className="text-xs text-destructive hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: team1.color, color: team1.textColor }}
                    >
                      {team1.short.slice(0, 2)}
                    </div>
                    <span className="font-semibold text-sm text-foreground">{team1.short}</span>
                    {voteCounts[match.team1] && (
                      <span className="text-[10px] text-muted-foreground">
                        ({voteCounts[match.team1]} votes)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-display">VS</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {voteCounts[match.team2] && (
                      <span className="text-[10px] text-muted-foreground">
                        ({voteCounts[match.team2]} votes)
                      </span>
                    )}
                    <span className="font-semibold text-sm text-foreground">{team2.short}</span>
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: team2.color, color: team2.textColor }}
                    >
                      {team2.short.slice(0, 2)}
                    </div>
                  </div>
                </div>

                {result ? (
                  <div className="text-center text-sm font-semibold text-secondary">
                    {result === "NR"
                      ? "🌧️ No Result"
                      : result === "DRAW"
                      ? "🤝 Draw"
                      : `🏆 ${IPL_TEAMS[result]?.short} Won`}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetWinner(match.id, match.team1)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Check size={12} />
                      {team1.short} Won
                    </button>
                    <button
                      onClick={() => handleSetWinner(match.id, match.team2)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Check size={12} />
                      {team2.short} Won
                    </button>
                    <button
                      onClick={() => handleSetWinner(match.id, "NR")}
                      className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                      title="No Result"
                    >
                      <CloudRain size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Admin;
