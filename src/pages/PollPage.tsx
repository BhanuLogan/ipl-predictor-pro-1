import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import MatchPoll from "@/components/MatchPoll";
import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import { api } from "@/lib/api";
import { getPollOpenMatches, isVotingLocked, type MatchResult } from "@/lib/data";
import { useMatches } from "@/lib/matches";
import { assignRanks } from "@/lib/utils";
import AnnouncementMarquee from "@/components/AnnouncementMarquee";

const PollPage = () => {
  const matches = useMatches();
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { activeRoom, loading: roomLoading } = useRoom();
  const navigate = useNavigate();
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, Record<string, number>>>({});
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [userRanks, setUserRanks] = useState<Record<string, number>>({});
  const [allVotes, setAllVotes] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, any>>({});
  const [announcement, setAnnouncement] = useState("");

  const match = matches.find(m => m.id === matchId);

  const loadData = useCallback(async () => {
    if (!activeRoom) return;
    try {
      const [votes, counts, r, boardData, ovs, ann] = await Promise.all([
        api.getVotes(activeRoom.id),
        api.getVoteCounts(activeRoom.id),
        api.getResults(),
        api.getRoomLeaderboard(activeRoom.id),
        api.getMatchOverrides(),
        api.getAnnouncement(),
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
      setAllVotes(votes);
      
      const sortedData = [...boardData].sort((a, b) => b.points - a.points);
      const ranked = assignRanks(sortedData);
      const ranks: Record<string, number> = {};
      ranked.forEach(entry => {
        // Store keys in lowercase for case-insensitive lookup
        ranks[entry.username.toLowerCase().trim()] = entry.rank;
      });
      setUserRanks(ranks);
      const ovMap: Record<string, any> = {};
      ovs.forEach((o: any) => { ovMap[o.match_id] = o; });
      setOverrides(ovMap);
      setAnnouncement(ann.text);
    } catch {} finally {
      setLoading(false);
    }
  }, [user, activeRoom]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user, navigate, loadData]);

  const handleVote = async (mid: string, prediction: string) => {
    if (!activeRoom) return;
    try {
      await api.vote(mid, prediction, activeRoom.id);
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

  if (loading || roomLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeRoom && user) {
     navigate("/rooms");
     return null;
  }

  const openMatches = getPollOpenMatches(matches, results, overrides);
  const isValid = openMatches.some(m => m.id === match.id) || !!results[match.id]?.winner || isVotingLocked(match, overrides[match.id]);

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
        <AnnouncementMarquee text={announcement} />
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
          allVotes={allVotes[match.id]}
          userRanks={userRanks}
          roomId={activeRoom?.id}
          override={overrides[match.id]}
        />
      </main>
    </div>
  );
};

export default PollPage;
