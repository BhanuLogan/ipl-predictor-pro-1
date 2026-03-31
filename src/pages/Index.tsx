import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import MatchPoll from "@/components/MatchPoll";
import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import { api } from "@/lib/api";
import { IPL_SCHEDULE, getPollOpenMatches, formatMatchDate, IPL_TEAMS, isVotingLocked, type MatchResult } from "@/lib/data";
import { MapPin, Users } from "lucide-react";
import OpenPolls from "@/components/dashboard/OpenPolls";
import CompletedMatches from "@/components/dashboard/CompletedMatches";
import UpcomingMatches from "@/components/dashboard/UpcomingMatches";

const PAGE_SIZE = 10;

const Index = () => {
  const { user } = useAuth();
  const { activeRoom, loading: roomLoading } = useRoom();
  const navigate = useNavigate();
  const [myVotes, setMyVotes] = useState<Record<string, string>>({}); // matchId -> my prediction
  const [voteCounts, setVoteCounts] = useState<Record<string, Record<string, number>>>({}); // matchId -> { team: count }
  const [allVotes, setAllVotes] = useState<Record<string, Record<string, string>>>({}); // matchId -> { username: prediction }
  const [results, setResults] = useState<Record<string, MatchResult>>({});

  // Pagination state
  const [pastPage, setPastPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

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

  // Memoized Lists
  const openPolls = useMemo(() => getPollOpenMatches(results), [results]);

  const pastMatches = useMemo(() => {
    return IPL_SCHEDULE.filter(m => results[m.id]).reverse();
  }, [results]);

  const upcomingLocked = useMemo(() => {
    const openIds = new Set(openPolls.map(o => o.id));
    return IPL_SCHEDULE.filter(m => !results[m.id] && !openIds.has(m.id));
  }, [results, openPolls]);

  // Paginated Lists
  const paginatedPast = useMemo(() => {
    return pastMatches.slice((pastPage - 1) * PAGE_SIZE, pastPage * PAGE_SIZE);
  }, [pastMatches, pastPage]);

  const paginatedUpcoming = useMemo(() => {
    return upcomingLocked.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE);
  }, [upcomingLocked, upcomingPage]);

  const totalPastPages = Math.ceil(pastMatches.length / PAGE_SIZE);
  const totalUpcomingPages = Math.ceil(upcomingLocked.length / PAGE_SIZE);

  if (!user) return null;

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

        <OpenPolls
          openPolls={openPolls}
          voteCounts={voteCounts}
          myVotes={myVotes}
          allVotes={allVotes}
          onVote={handleVote}
          completedCount={completedCount}
          results={results}
        />

        <CompletedMatches
          pastMatches={pastMatches}
          paginatedPast={paginatedPast}
          pastPage={pastPage}
          totalPastPages={totalPastPages}
          setPastPage={setPastPage}
          voteCounts={voteCounts}
          myVotes={myVotes}
          results={results}
          onVote={handleVote}
        />

        <UpcomingMatches
          upcomingLocked={upcomingLocked}
          paginatedUpcoming={paginatedUpcoming}
          upcomingPage={upcomingPage}
          totalUpcomingPages={totalUpcomingPages}
          setUpcomingPage={setUpcomingPage}
        />
      </main>
    </div>
  );
};

export default Index;
