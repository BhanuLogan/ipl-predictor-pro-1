import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { api, type LeaderboardEntry } from "@/lib/api";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    api.getLeaderboard().then(setLeaderboard).catch(() => {});
  }, [user, navigate]);

  if (!user) return null;

  const rankIcons = [
    <Trophy className="text-primary" size={20} />,
    <Medal className="text-muted-foreground" size={20} />,
    <Award className="text-primary/60" size={20} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            LEADERBOARD
          </h2>
          <p className="mt-2 text-muted-foreground">
            Who's the ultimate cricket oracle? 🏆
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ✅ Correct pick = 2 pts · 🤝 Tied/No Result = 2 pts everyone
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
            {leaderboard.map((entry, i) => (
              <div
                key={entry.username}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all animate-slide-up ${
                  entry.username === user.username
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
                    {entry.username}
                    {entry.username === user.username && (
                      <span className="ml-2 text-xs text-primary">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.voted} voted · {entry.correct} correct
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-3xl text-gradient-gold">
                    {entry.points}
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
