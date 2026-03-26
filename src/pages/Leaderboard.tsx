import Header from "@/components/Header";
import { getLeaderboard, getUsername } from "@/lib/data";
import { Trophy, Medal, Award } from "lucide-react";
import { useState } from "react";

const Leaderboard = () => {
  const [, setUser] = useState(getUsername());
  const leaderboard = getLeaderboard();
  const currentUser = getUsername();

  const rankIcons = [
    <Trophy className="text-primary" size={20} />,
    <Medal className="text-muted-foreground" size={20} />,
    <Award className="text-primary/60" size={20} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => { localStorage.clear(); setUser(null); window.location.href = "/"; }} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            LEADERBOARD
          </h2>
          <p className="mt-2 text-muted-foreground">
            Who's the ultimate cricket oracle? 🏆
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-gradient-card border border-border p-12 text-center">
            <span className="text-5xl">📊</span>
            <h3 className="mt-4 font-display text-3xl text-foreground">No Scores Yet</h3>
            <p className="mt-2 text-muted-foreground">
              Start voting on matches to see the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((user, i) => (
              <div
                key={user.username}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all animate-slide-up ${
                  user.username === currentUser
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-gradient-card"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center">
                  {i < 3 ? rankIcons[i] : (
                    <span className="font-display text-xl text-muted-foreground">
                      {i + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {user.username}
                    {user.username === currentUser && (
                      <span className="ml-2 text-xs text-primary">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.correct}/{user.total} correct predictions
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-3xl text-gradient-gold">
                    {user.points}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
