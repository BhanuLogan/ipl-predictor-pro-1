import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";
import Header from "@/components/Header";

import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import { api, type LeaderboardEntry } from "@/lib/api";
import UserPredictionsDialog from "@/components/UserPredictionsDialog";
import { getAvatarUrl } from "@/lib/utils";
import Footer from "@/components/Footer";

/* ─── Rank assignment (tie = same rank, next is gap-ranked) ─── */
function assignRanks(entries: LeaderboardEntry[]): (LeaderboardEntry & { rank: number })[] {
  return entries.map((entry, i, arr) => {
    const rank = i === 0 ? 1 : arr[i - 1].points === entry.points
      ? (arr as any)[i - 1]._rank
      : i + 1;
    (entry as any)._rank = rank;
    return { ...entry, rank };
  });
}

/* ─── Skeleton row ─── */
const SkeletonRow = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex items-center gap-4 rounded-xl border border-border bg-gradient-card p-4 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="h-10 w-10 rounded-full bg-muted/60" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-32 rounded bg-muted/60" />
      <div className="h-2 w-20 rounded bg-muted/40" />
    </div>
    <div className="h-8 w-12 rounded bg-muted/60" />
  </div>
);

/* ─── Skeleton podium block ─── */
const SkeletonPodium = () => (
  <div className="flex items-end justify-center gap-3 mb-10 px-2">
    {/* 2nd */}
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="h-16 w-16 rounded-full bg-muted/50" />
      <div className="h-3 w-16 rounded bg-muted/50" />
      <div className="flex items-end justify-center rounded-t-xl bg-muted/30 border border-border/30"
        style={{ width: 90, height: 80 }} />
    </div>
    {/* 1st */}
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="h-20 w-20 rounded-full bg-muted/50" />
      <div className="h-3 w-20 rounded bg-muted/50" />
      <div className="flex items-end justify-center rounded-t-xl bg-muted/30 border border-border/30"
        style={{ width: 100, height: 110 }} />
    </div>
    {/* 3rd */}
    <div className="flex flex-col items-center gap-2 animate-pulse">
      <div className="h-14 w-14 rounded-full bg-muted/50" />
      <div className="h-3 w-16 rounded bg-muted/50" />
      <div className="flex items-end justify-center rounded-t-xl bg-muted/30 border border-border/30"
        style={{ width: 90, height: 60 }} />
    </div>
  </div>
);

/* ─── Podium tile for top 3 ─── */
const podiumConfig = [
  { order: 1, avatarSize: 20, height: 110, width: 100, medal: "🥇", bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/40", shadow: "shadow-yellow-500/20" },
  { order: 0, avatarSize: 16, height: 80, width: 90, medal: "🥈", bg: "from-slate-400/20 to-slate-500/10", border: "border-slate-400/40", shadow: "shadow-slate-400/20" },
  { order: 2, avatarSize: 14, height: 60, width: 90, medal: "🥉", bg: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/40", shadow: "shadow-orange-400/20" },
];

function PodiumTile({
  entry,
  rank,
  cfg,
  isCurrentUser,
  onAvatarClick,
}: {
  entry: LeaderboardEntry & { rank: number };
  rank: 1 | 2 | 3;
  cfg: typeof podiumConfig[0];
  isCurrentUser: boolean;
  onAvatarClick: () => void;
}) {
  const avatarPx = cfg.avatarSize * 5;

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer"
      style={{ order: cfg.order }}
      onClick={onAvatarClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onAvatarClick();
      }}
    >
      {/* Crown / rank badge */}
      <span className="text-2xl leading-none mb-1">{cfg.medal}</span>

      {/* Avatar — tap to see match picks */}
      <div
        title={`${entry.username}'s predictions`}
        className={`rounded-full flex items-center justify-center font-display font-bold text-background border-2 ${cfg.border} shadow-lg ${cfg.shadow} ${isCurrentUser ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} overflow-hidden`}
        style={{ width: avatarPx, height: avatarPx, fontSize: avatarPx * 0.35, backgroundColor: entry.profile_pic ? "transparent" : "" }}
      >
        <img src={getAvatarUrl(entry.profile_pic, entry.username)} alt={entry.username} className="h-full w-full object-cover" />
      </div>

      {/* Username */}
      <p className={`text-xs font-semibold text-foreground text-center leading-tight max-w-[88px] truncate ${isCurrentUser ? "text-primary" : ""}`}>
        {entry.username}
        {isCurrentUser && <span className="block text-[9px] text-primary/70">(You)</span>}
      </p>

      {/* Points label */}
      <p className="font-display text-lg text-gradient-gold leading-none">{entry.points}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">pts</p>

      {/* Podium block */}
      <div
        className={`w-full rounded-t-xl bg-gradient-to-t ${cfg.bg} border ${cfg.border} shadow-lg flex items-start justify-center pt-2`}
        style={{ height: cfg.height, width: cfg.width }}
      >
        <span className="font-display text-3xl text-muted-foreground/50">#{rank}</span>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
const Leaderboard = () => {
  const { user } = useAuth();
  const { activeRoom } = useRoom();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<(LeaderboardEntry & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"podium" | "table">("podium");
  const [pickUser, setPickUser] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (activeRoom) {
      navigate(`/rooms/${activeRoom.id}`, { replace: true });
      return;
    }
    setLoading(true);
    api.getLeaderboard()
      .then((data) => setLeaderboard(assignRanks(data)))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user, navigate, activeRoom]);

  if (!user) return null;

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  /* Reorder top3 as [2nd, 1st, 3rd] for podium layout */
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as (LeaderboardEntry & { rank: number })[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">LEADERBOARD</h2>
          <p className="mt-2 text-muted-foreground">Who's the ultimate cricket oracle? 🏆</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ✅ Correct pick = 2 pts · 🤝 Tied/No Result = 1 pt everyone
          </p>
        </div>

        {/* Tab Toggler */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-muted/50 rounded-xl border border-border">
            <button
              onClick={() => setView("podium")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${view === "podium"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              PODIUM
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${view === "table"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              POINTS TABLE
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <>
            <SkeletonPodium />
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} delay={i * 60} />)}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && leaderboard.length === 0 && (
          <div className="rounded-2xl bg-gradient-card border border-border p-12 text-center">
            <span className="text-5xl">📊</span>
            <h3 className="mt-4 font-display text-3xl text-foreground">No Scores Yet</h3>
            <p className="mt-2 text-muted-foreground">Start voting on matches to see the leaderboard!</p>
          </div>
        )}

        {/* Podium View */}
        {!loading && leaderboard.length > 0 && view === "podium" && (
          <>
            <div className="flex items-end justify-center gap-3 mb-10 px-2">
              {podiumOrder.map((entry, idx) => {
                // idx 0 -> Silver position (Left), idx 1 -> Gold position (Middle), idx 2 -> Bronze position (Right)
                // This corresponds to cfg mapping: idx 0 -> podiumConfig[1], idx 1 -> podiumConfig[0], idx 2 -> podiumConfig[2]
                const cfgIndex = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                return (
                  <PodiumTile
                    key={entry.username}
                    entry={entry}
                    rank={entry.rank as 1 | 2 | 3}
                    cfg={podiumConfig[cfgIndex]}
                    isCurrentUser={entry.username === user.username}
                    onAvatarClick={() => setPickUser(entry.username)}
                  />
                );
              })}
            </div>

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 pl-1">Rankings</p>
                {rest.map((entry, i) => (
                  <div
                    key={entry.username}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all animate-slide-up cursor-pointer ${entry.username === user.username
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-gradient-card"
                      }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setPickUser(entry.username)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPickUser(entry.username);
                    }}
                    aria-label={`Open ${entry.username}'s predictions`}
                    aria-disabled={false}
                  >
                    {/* Rank number */}
                    <div className="flex h-10 w-10 items-center justify-center shrink-0">
                      <span className="font-display text-xl text-muted-foreground">#{entry.rank}</span>
                    </div>

                    <button
                      type="button"
                      title={`${entry.username}'s predictions`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickUser(entry.username);
                      }}
                      className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden text-foreground cursor-pointer ring-offset-background focus:outline-none focus-visible:ring-2  focus-visible:ring-primary"
                    >
                      <img src={getAvatarUrl(entry.profile_pic, entry.username)} alt={entry.username} className="h-full w-full object-cover" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {entry.username}
                        {entry.username === user.username && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.voted} voted · {entry.correct} correct · {entry.matches} total
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display text-3xl text-gradient-gold leading-none">{entry.points}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Table View */}
        {!loading && leaderboard.length > 0 && view === "table" && (
          <div className="animate-fade-in overflow-x-auto rounded-2xl border border-border bg-gradient-card shadow-xl">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rank</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Player</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Matches</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Voted</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wins</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Losses</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">NRR</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.username}
                    className={`border-b border-border/30 transition-colors hover:bg-muted/10 ${entry.username === user.username ? "bg-primary/5" : ""}`}
                    onClick={() => setPickUser(entry.username)}
                    style={{ cursor: "pointer" }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setPickUser(entry.username);
                    }}
                  >
                    <td className="px-4 py-4 font-display text-lg text-muted-foreground">#{entry.rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          title={`${entry.username}'s predictions`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickUser(entry.username);
                          }}
                          className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border cursor-pointer ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <img src={getAvatarUrl(entry.profile_pic, entry.username)} alt={entry.username} className="h-full w-full object-cover" />
                        </button>
                        <span className={`font-semibold ${entry.username === user.username ? "text-primary" : "text-foreground"}`}>
                          {entry.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium">{entry.matches}</td>
                    <td className="px-4 py-4 text-center text-sm font-medium">{entry.voted}</td>
                    <td className="px-4 py-4 text-center text-sm font-medium text-secondary">{entry.correct}</td>
                    <td className="px-4 py-4 text-center text-sm font-medium text-destructive">{entry.voted - entry.correct}</td>
                    <td className="px-4 py-4 text-center text-sm font-medium">
                      {entry.nrr == null ? "—" : (entry.nrr / 100).toFixed(3)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-display text-xl text-gradient-gold">{entry.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Footer />
      </main>

      <UserPredictionsDialog
        username={pickUser}
        roomId={activeRoom?.id || null}
        open={!!pickUser}
        onOpenChange={(o) => {
          if (!o) setPickUser(null);
        }}
      />
    </div>
  );
};

export default Leaderboard;
