import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MatchPoll from "@/components/MatchPoll";
import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import { api } from "@/lib/api";
import { IPL_SCHEDULE, getPollOpenMatches, formatMatchDate, IPL_TEAMS, isVotingLocked, type MatchResult } from "@/lib/data";
import { MapPin, Users } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { activeRoom, loading: roomLoading } = useRoom();
  const navigate = useNavigate();
  const [myVotes, setMyVotes] = useState<Record<string, string>>({}); // matchId -> my prediction
  const [voteCounts, setVoteCounts] = useState<Record<string, Record<string, number>>>({}); // matchId -> { team: count }
  const [allVotes, setAllVotes] = useState<Record<string, Record<string, string>>>({}); // matchId -> { username: prediction }
  const [results, setResults] = useState<Record<string, MatchResult>>({});

  const loadData = useCallback(async () => {
    if (!activeRoom) return;
    try {
      const [votes, counts, r] = await Promise.all([
        api.getVotes(activeRoom.id),
        api.getVoteCounts(activeRoom.id),
        api.getResults(),
      ]);
      // Extract my votes from the full votes object
      if (user) {
        const mine: Record<string, string> = {};
        for (const [matchId, matchVotes] of Object.entries(votes)) {
          if (matchVotes[user.username]) {
            mine[matchId] = matchVotes[user.username];
          }
        }
        setMyVotes(mine);
      }
      setAllVotes(votes);
      setVoteCounts(counts);
      setResults(r);
    } catch {
      // API not available
    }
  }, [user, activeRoom]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.is_admin) { navigate("/admin"); return; }
    if (!roomLoading && !activeRoom) { navigate("/rooms"); return; }
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [user, navigate, loadData, activeRoom, roomLoading]);

  const handleVote = async (matchId: string, prediction: string, isBulk?: boolean) => {
    if (!activeRoom) return;
    try {
      if (isBulk) {
        await api.bulkVote(matchId, prediction);
      } else {
        await api.vote(matchId, prediction, activeRoom.id);
      }
      await loadData();
    } catch {
      // handle error
    }
  };

  if (!user) return null;

  const openPolls = getPollOpenMatches(results);
  const pastMatches = IPL_SCHEDULE.filter(m => results[m.id]);
  const upcomingLocked = IPL_SCHEDULE.filter(m => !results[m.id] && !openPolls.find(o => o.id === m.id));
  const completedCount = Object.keys(results).length;

  if (roomLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeRoom) {
    return null; // Side effect in useEffect will handle redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        {/* Active Room Indicator */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Room</p>
              <h3 className="font-display text-2xl text-foreground leading-none">{activeRoom.name}</h3>
            </div>
          </div>
          <button
            onClick={() => navigate("/rooms")}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Switch Room
          </button>
        </div>
        {/* Open Polls */}
        {openPolls.length > 0 ? (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
              <h2 className="font-display text-3xl text-gradient-gold">
                {openPolls.some(m => isVotingLocked(m))
                  ? "LIVE MATCH IN PROGRESS"
                  : `LIVE POLL${openPolls.length > 1 ? "S" : ""} — VOTE NOW!`}
              </h2>
            </div>
            <div className="space-y-4">
              {openPolls.map(match => {
                const counts = voteCounts[match.id] || {};
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                return (
                  <MatchPoll
                    key={match.id}
                    match={match}
                    voteCounts={counts}
                    totalVotes={total}
                    myPick={myVotes[match.id] || null}
                    result={undefined}
                    onVote={handleVote}
                    isOpen
                    allVotes={allVotes[match.id] || {}}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
              POLLS
            </h2>
            <div className="mt-4 rounded-2xl bg-gradient-card border border-border p-8">
              <p className="text-muted-foreground">
                {IPL_SCHEDULE.every(m => results[m.id])
                  ? "🏆 IPL 2026 is complete! Check the leaderboard!"
                  : completedCount === 0
                    ? "🚀 IPL 2026 starts March 28! First poll opens then."
                    : "⏳ Next poll opens after the current match finishes."}
              </p>
            </div>
          </div>
        )}

        {/* Completed Matches */}
        {pastMatches.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 font-display text-2xl text-foreground">📜 COMPLETED MATCHES</h3>
            <div className="space-y-4">
              {[...pastMatches].reverse().map(match => {
                const counts = voteCounts[match.id] || {};
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                return (
                  <MatchPoll
                    key={match.id}
                    match={match}
                    voteCounts={counts}
                    totalVotes={total}
                    myPick={myVotes[match.id] || null}
                    result={results[match.id]?.winner}
                    scoreSummary={results[match.id]?.scoreSummary}
                    onVote={handleVote}
                    isOpen={false}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Schedule */}
        {upcomingLocked.length > 0 && (
          <div>
            <h3 className="mb-4 font-display text-2xl text-foreground">📅 UPCOMING MATCHES</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {upcomingLocked.map(match => (
                <div key={match.id} className="rounded-xl bg-gradient-card border border-border p-4">
                  <p className="text-xs text-muted-foreground">{formatMatchDate(match.date, match.time)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: IPL_TEAMS[match.team1]?.color, color: IPL_TEAMS[match.team1]?.textColor }}
                    >
                      {match.team1}
                    </span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: IPL_TEAMS[match.team2]?.color, color: IPL_TEAMS[match.team2]?.textColor }}
                    >
                      {match.team2}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin size={10} />
                    {match.venue.split(",")[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
