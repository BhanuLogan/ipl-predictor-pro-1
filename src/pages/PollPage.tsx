import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import MatchPoll from "@/components/MatchPoll";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { IPL_SCHEDULE, getPollOpenMatches, isVotingLocked, type MatchResult } from "@/lib/data";

const PollPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, Record<string, number>>>({});
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [loading, setLoading] = useState(true);

  const match = IPL_SCHEDULE.find(m => m.id === matchId);

  const loadData = useCallback(async () => {
    try {
      const [votes, counts, r] = await Promise.all([
        api.getVotes(),
        api.getVoteCounts(),
        api.getResults(),
      ]);
      if (user) {
        const mine: Record<string, string> = {};
        for (const [mid, matchVotes] of Object.entries(votes)) {
          if (matchVotes[user.username]) {
            mine[mid] = matchVotes[user.username];
          }
        }
        setMyVotes(mine);
      }
      setVoteCounts(counts);
      setResults(r);
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user, navigate, loadData]);

  const handleVote = async (mid: string, prediction: string) => {
    try {
      await api.vote(mid, prediction);
      await loadData();
    } catch {}
  };

  if (!user || !match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Match not found</p>
          <Link to="/" className="text-primary hover:underline">Go to Polls</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const openMatches = getPollOpenMatches(results);
  const isValid = openMatches.some(m => m.id === match.id) || !!results[match.id]?.winner || isVotingLocked(match);

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">This poll is not available yet</p>
          <Link to="/" className="text-primary hover:underline">Go to Polls</Link>
        </div>
      </div>
    );
  }

  const counts = voteCounts[match.id] || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Link to="/" className="mb-4 inline-block text-sm text-primary hover:underline">← Back to all polls</Link>
        <MatchPoll
          match={match}
          voteCounts={counts}
          totalVotes={total}
          myPick={myVotes[match.id] || null}
          result={results[match.id]?.winner}
          scoreSummary={results[match.id]?.scoreSummary}
          onVote={handleVote}
          isOpen={!results[match.id]?.winner}
        />
      </main>
    </div>
  );
};

export default PollPage;
