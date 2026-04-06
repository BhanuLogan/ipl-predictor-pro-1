import React, { useState, useRef, useCallback } from "react";
import { IPL_TEAMS, formatMatchDate } from "@/lib/data";
import { Calendar, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { Match, MatchResult } from "@/lib/data";

const LOAD_BATCH = 10;

interface Props {
  pastMatches: Match[];
  paginatedPast: Match[];
  pastPage: number;
  totalPastPages: number;
  setPastPage: (page: number) => void;
  voteCounts: Record<string, Record<string, number>>;
  myVotes: Record<string, string>;
  results: Record<string, MatchResult>;
  onVote: (matchId: string, prediction: string, isBulk?: boolean) => Promise<void>;
}

const CompletedMatchCard = React.memo(({ match, result, myPick }: {
  match: Match;
  result: MatchResult;
  myPick: string | null;
}) => {
  const team1 = IPL_TEAMS[match.team1];
  const team2 = IPL_TEAMS[match.team2];
  const winner = result.winner;
  const isNR = winner === "nr";
  const isDraw = winner === "draw";
  const myPickCorrect = myPick && (isNR || isDraw || myPick === winner);
  const myPickWrong = myPick && !isNR && !isDraw && myPick !== winner;

  return (
    <div className="flex-none w-[220px] rounded-2xl border border-border bg-gradient-card p-4 shadow-md flex flex-col gap-3 hover:border-primary/30 transition-all">
      {/* Date */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Calendar size={10} />
        <span>{formatMatchDate(match.date)}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden bg-white shadow-sm border border-border/50 ${winner === match.team1 ? "ring-2 ring-offset-1 ring-offset-card" : "opacity-80"}`}
            style={team1.logo ? (winner === match.team1 ? { ["--tw-ring-color" as any]: team1.color } : {}) : {
              backgroundColor: team1.color,
              color: team1.textColor,
              ...(winner === match.team1 ? { ["--tw-ring-color" as any]: team1.color } : {}),
            }}
          >
            {team1.logo ? (
              <img src={team1.logo} alt={team1.short} className="h-full w-full object-contain p-1" />
            ) : (
              team1.short.slice(0, 2)
            )}
          </div>
          <span className={`font-display text-sm ${winner === match.team1 ? "text-foreground" : "text-muted-foreground"}`}>
            {team1.short}
          </span>
          {winner === match.team1 && <span className="text-base">🏆</span>}
        </div>

        <span className="text-[10px] text-muted-foreground font-display">VS</span>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div
            className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden bg-white shadow-sm border border-border/50 ${winner === match.team2 ? "ring-2 ring-offset-1 ring-offset-card" : "opacity-80"}`}
            style={team2.logo ? (winner === match.team2 ? { ["--tw-ring-color" as any]: team2.color } : {}) : {
              backgroundColor: team2.color,
              color: team2.textColor,
              ...(winner === match.team2 ? { ["--tw-ring-color" as any]: team2.color } : {}),
            }}
          >
            {team2.logo ? (
              <img src={team2.logo} alt={team2.short} className="h-full w-full object-contain p-1" />
            ) : (
              team2.short.slice(0, 2)
            )}
          </div>
          <span className={`font-display text-sm ${winner === match.team2 ? "text-foreground" : "text-muted-foreground"}`}>
            {team2.short}
          </span>
          {winner === match.team2 && <span className="text-base">🏆</span>}
        </div>
      </div>

      {/* Result badge */}
      <div className="rounded-lg bg-secondary/10 border border-secondary/20 px-2 py-1.5 text-center flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-secondary">
          {isNR ? "🌧️ No Result" : isDraw ? "🤝 Tied" : `${IPL_TEAMS[winner]?.short || winner} won`}
        </p>
        {result.scoreSummary && (
          <p className="text-[9px] text-muted-foreground/80 leading-snug">
            {result.scoreSummary}
          </p>
        )}
      </div>

      {/* My prediction */}
      {myPick ? (
        <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
          myPickCorrect ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"
        }`}>
          {myPickCorrect ? <Check size={11} className="text-primary shrink-0" /> : <X size={11} className="text-destructive shrink-0" />}
          <span className={`text-[10px] font-medium ${myPickCorrect ? "text-primary" : "text-destructive"}`}>
            {myPickCorrect ? (isNR || isDraw ? "+1 pt" : "+2 pts") : "No pts · " + (IPL_TEAMS[myPick]?.short || myPick)}
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/30 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground text-center">No prediction</p>
        </div>
      )}
    </div>
  );
});

CompletedMatchCard.displayName = "CompletedMatchCard";

const CompletedMatches = React.memo(({
  pastMatches,
  voteCounts: _voteCounts,
  myVotes,
  results,
}: Props) => {
  const [visibleCount, setVisibleCount] = useState(LOAD_BATCH);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleMatches = pastMatches.slice(0, visibleCount);
  const hasMore = visibleCount < pastMatches.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + LOAD_BATCH, pastMatches.length));
  }, [pastMatches.length]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -460, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 460, behavior: "smooth" });
    // Lazy load more when scrolling right near end
    if (hasMore) {
      const el = scrollRef.current;
      if (el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 460) {
        loadMore();
      }
    }
  };

  if (pastMatches.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl text-foreground uppercase tracking-wide">
          📜 Completed Matches
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={scrollLeft}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={scrollRight}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (hasMore && el.scrollLeft + el.clientWidth >= el.scrollWidth - 300) {
            loadMore();
          }
        }}
        className="flex gap-3 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
      >
        {visibleMatches.map(match => (
          <CompletedMatchCard
            key={match.id}
            match={match}
            result={results[match.id]}
            myPick={myVotes[match.id] || null}
          />
        ))}
        {hasMore && (
          <div className="flex-none w-[120px] flex items-center justify-center">
            <button
              onClick={loadMore}
              className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex flex-col items-center gap-2"
            >
              <ChevronRight size={18} />
              Load more
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-right text-[10px] text-muted-foreground">
        {Math.min(visibleCount, pastMatches.length)} of {pastMatches.length} matches
      </p>
    </div>
  );
});

CompletedMatches.displayName = "CompletedMatches";

export default CompletedMatches;
