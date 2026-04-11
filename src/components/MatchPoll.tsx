import { useState, useEffect } from "react";
import { IPL_TEAMS, type Match, formatMatchDate, isVotingLocked } from "@/lib/data";
import { Check, MapPin, Calendar, Share2, Lock, RefreshCw, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import UserPredictionsDialog from "./UserPredictionsDialog";

interface MatchPollProps {
  match: Match;
  voteCounts: Record<string, number>; // { teamShort: count }
  totalVotes: number;
  myPick: string | null;
  result?: string;
  /** Cricbuzz-style score / result line for completed matches */
  scoreSummary?: string | null;
  onVote: (matchId: string, prediction: string, isBulk?: boolean) => void;
  isOpen: boolean;
  allVotes?: Record<string, string>;
  userRanks?: Record<string, number>;
  roomId?: number;
  override?: { manual_locked: boolean | null; lock_delay: number };
  liveScore?: { score: string | null; status: string | null; toss?: string | null } | null;
}

const MatchPoll = ({ match, voteCounts, totalVotes, myPick, result, scoreSummary, onVote, isOpen, allVotes, userRanks, roomId, override, liveScore }: MatchPollProps) => {
  const [selected, setSelected] = useState<string | null>(myPick);
  const [hasVoted, setHasVoted] = useState(!!myPick);
  const [isChanging, setIsChanging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!result); // Collapsed by default if completed
  const [applyToAll, setApplyToAll] = useState(false);
  const [pickUser, setPickUser] = useState<string | null>(null);

  // Sync when myPick loads asynchronously (e.g. after page refresh)
  useEffect(() => {
    if (myPick && !isChanging) {
      setSelected(myPick);
      setHasVoted(true);
    }
  }, [myPick, isChanging]);

  const team1 = IPL_TEAMS[match.team1];
  const team2 = IPL_TEAMS[match.team2];
  const isCompleted = !!result;
  const locked = isVotingLocked(match, override);

  const handleVote = () => {
    if (!selected) return;
    onVote(match.id, selected, applyToAll);
    setHasVoted(true);
    setIsChanging(false);
  };

  const handleChangeVote = () => {
    setIsChanging(true);
    setSelected(myPick); // keep their previous selection highlighted
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSelected(myPick);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/poll/${match.id}`;
    if (navigator.share) {
      navigator.share({ title: `IPL 2026: ${match.team1} vs ${match.team2}`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Poll link copied!");
    }
  };

  // Can vote: poll open, not completed, not locked, and either hasn't voted yet OR is actively changing
  const canVote = isOpen && !isCompleted && !locked && (!hasVoted || isChanging);

  if (isCompleted && !isExpanded) {
    return (
      <div className="animate-slide-up space-y-2">
        <div
          onClick={() => setIsExpanded(true)}
          className="cursor-pointer rounded-2xl bg-gradient-card border border-border p-4 shadow-md hover:border-primary/30 transition-all flex items-center justify-between"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{formatMatchDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-2 font-display text-sm">
              <span>{match.team1}</span>
              <span className="text-muted-foreground text-[10px]">VS</span>
              <span>{match.team2}</span>
            </div>
            <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-semibold text-secondary">
              {result === "nr" ? "No Result" : result === "draw" ? "Tied" : `${result} won`}
            </span>
          </div>
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        </div>
        {scoreSummary ? (
          <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Score</p>
            <p className="text-xs text-foreground leading-snug">{scoreSummary}</p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animate-slide-up rounded-2xl bg-gradient-card border border-border p-6 shadow-xl relative">
      {isCompleted && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-12 p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Collapse"
        >
          <ChevronUp size={16} />
        </button>
      )}
      {/* Match info */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={14} />
          <span>{formatMatchDate(match.date, match.time)}</span>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary">
              Completed
            </span>
          )}
          {isOpen && !isCompleted && locked && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-xs font-semibold text-destructive">
              <Lock size={10} /> Locked
            </span>
          )}
          {isOpen && !isCompleted && !locked && (
            <span className="animate-pulse-slow rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
              Live Poll
            </span>
          )}
          <button onClick={handleShare} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Share poll">
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
        <MapPin size={12} />
        <span>{match.venue}</span>
      </div>

      {/* Live Score Banner — shown when match is in progress */}
      {isOpen && locked && !isCompleted && liveScore && (liveScore.score || liveScore.status || liveScore.toss) && (
        <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Live Score</p>
          </div>
          {liveScore.toss && (
            <p className="text-[11px] text-muted-foreground mb-1 leading-snug">🪙 {liveScore.toss}</p>
          )}
          {liveScore.score && (
            <p className="text-sm font-semibold text-foreground leading-snug">{liveScore.score}</p>
          )}
          {liveScore.status && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{liveScore.status}</p>
          )}
        </div>
      )}

      {/* Previous vote banner (shown when user has voted and is not changing) */}
      {hasVoted && !isCompleted && !isChanging && myPick && (
        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Your pick:{" "}
              <strong className="text-primary">{IPL_TEAMS[myPick]?.name || myPick}</strong>
            </p>
          </div>
          {/* Only allow changing if poll is still open & not locked */}
          {isOpen && !locked && (
            <button
              onClick={handleChangeVote}
              className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <RefreshCw size={11} />
              Change Vote
            </button>
          )}
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
        <TeamButton
          team={team1}
          teamKey={match.team1}
          selected={selected === match.team1}
          disabled={!canVote}
          isWinner={result === match.team1}
          isPreviousPick={!isChanging && myPick === match.team1 && hasVoted}
          onClick={() => canVote && setSelected(match.team1)}
          voteCount={voteCounts[match.team1] || 0}
          totalVotes={totalVotes}
          showVotes={isCompleted || locked} // Only show team votes when locked or completed
          voters={allVotes ? Object.keys(allVotes).filter(u => allVotes[u] === match.team1) : []}
          showVoters={locked || isCompleted}
          userRanks={userRanks}
          onVoterClick={setPickUser}
        />

        <div className="flex flex-col items-center">
          <span className="font-display text-2xl text-muted-foreground">VS</span>
          {totalVotes > 0 && (
            <p className="mt-1 text-[10px] text-muted-foreground">{totalVotes} votes</p>
          )}
        </div>

        <TeamButton
          team={team2}
          teamKey={match.team2}
          selected={selected === match.team2}
          disabled={!canVote}
          isWinner={result === match.team2}
          isPreviousPick={!isChanging && myPick === match.team2 && hasVoted}
          onClick={() => canVote && setSelected(match.team2)}
          voteCount={voteCounts[match.team2] || 0}
          totalVotes={totalVotes}
          showVotes={isCompleted || locked} // Only show team votes when locked or completed
          voters={allVotes ? Object.keys(allVotes).filter(u => allVotes[u] === match.team2) : []}
          showVoters={locked || isCompleted}
          userRanks={userRanks}
          onVoterClick={setPickUser}
        />
      </div>

      {/* Result banner */}
      {isCompleted && (
        <div className="mb-4 rounded-xl bg-secondary/10 border border-secondary/20 p-3 text-center">
          <p className="text-sm text-secondary font-semibold">
            {result === "nr"
              ? "🌧️ No Result"
              : result === "draw"
              ? "🤝 Match Tied"
              : `🏆 ${IPL_TEAMS[result]?.name || result} won!`}
          </p>
          {scoreSummary && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{scoreSummary}</p>
          )}
          {myPick && (
            <p className="text-xs text-muted-foreground mt-1">
              {result === "nr" || result === "draw"
                ? "You earned 1 point"
                : myPick === result
                ? "✅ You predicted correctly! +2 points"
                : "❌ Better luck next time!"}
            </p>
          )}
        </div>
      )}

      {isCompleted && scoreSummary && (
        <div className="mb-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Match summary</p>
          <p className="text-xs text-foreground leading-relaxed">{scoreSummary}</p>
        </div>
      )}

      {/* Bulk Vote Toggle */}
      {canVote && (
        <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/40">
          <input
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-muted text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-foreground italic">Apply prediction to all my rooms</span>
        </label>
      )}

      {/* Vote / Change Vote buttons */}
      {canVote && (
        <div className="space-y-2">
          <button
            onClick={handleVote}
            disabled={!selected || selected === myPick && isChanging}
            className="w-full rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed glow-gold"
          >
            {isChanging ? "CONFIRM NEW PREDICTION" : "LOCK IN PREDICTION"}
          </button>
          {isChanging && (
            <button
              onClick={handleCancelChange}
              className="w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {locked && !isCompleted && !hasVoted && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <Lock size={16} />
          <span>Voting closed at 7:30 PM IST</span>
        </div>
      )}

      {!isCompleted && roomId && (
        locked ? (
          <Link
            to={`/rooms/${roomId}/chat/${match.id}`}
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-red-500/10 border border-red-500/20 py-3.5 text-sm font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white shadow-sm"
          >
            <MessageCircle size={18} className="animate-pulse" />
            GO TO CHAT ROOM
          </Link>
        ) : (
          <Link
            to={`/rooms/${roomId}/chat/${match.id}`}
            className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-muted/60 border border-border/50 py-3.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <MessageCircle size={16} />
            Open Chat Room
          </Link>
        )
      )}

      <UserPredictionsDialog
        username={pickUser}
        roomId={roomId || null}
        open={!!pickUser}
        onOpenChange={(o) => {
          if (!o) setPickUser(null);
        }}
      />
    </div>
  );
};

function TeamButton({
  team,
  teamKey,
  selected,
  disabled,
  isWinner,
  isPreviousPick,
  onClick,
  voteCount,
  totalVotes,
  showVotes,
  voters,
  showVoters,
  userRanks,
  onVoterClick,
}: {
  team: { name: string; short: string; color: string; textColor: string; logo?: string };
  teamKey: string;
  selected: boolean;
  disabled: boolean;
  isWinner: boolean;
  isPreviousPick: boolean;
  onClick: () => void;
  voteCount: number;
  totalVotes: number;
  showVotes: boolean;
  voters?: string[];
  showVoters?: boolean;
  userRanks?: Record<string, number>;
  onVoterClick?: (username: string) => void;
}) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-primary shadow-lg scale-[1.02]"
          : isWinner
          ? "border-secondary shadow-lg"
          : "border-border hover:border-muted-foreground/30"
      } ${disabled && !isWinner ? "opacity-70" : ""} ${!disabled ? "cursor-pointer" : ""}`}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold overflow-hidden bg-white shadow-inner"
        style={team.logo ? {} : { backgroundColor: team.color, color: team.textColor }}
      >
        {team.logo ? (
           <img src={team.logo} alt={team.short} className="h-full w-full object-contain p-1.5" />
        ) : (
           team.short.slice(0, 2)
        )}
      </div>
      <span className="font-display text-xl text-foreground">{team.short}</span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{team.name}</span>

      {/* "Your pick" badge */}
      {isPreviousPick && (
        <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9px] font-semibold text-primary">
          Your pick
        </span>
      )}

      {showVotes && (
        <div className="mt-1 w-full">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: team.color }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {voteCount} vote{voteCount !== 1 ? "s" : ""}
          </p>
          {showVoters && voters && voters.length > 0 && (
            <div className="mt-2 text-left w-full border-t border-muted/50 pt-2 px-1 max-h-24 overflow-y-auto custom-scrollbar">
              <p className="text-[9px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-center">Voters</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {voters.map(v => {
                  const normalizedUser = v.toLowerCase().trim();
                  const rank = userRanks?.[normalizedUser];
                  return (
                    <button
                      key={v}
                      onClick={(e) => { e.stopPropagation(); onVoterClick?.(v); }}
                      type="button"
                      className="rounded bg-background border border-border/50 px-1.5 py-0.5 text-[9px] text-foreground hover:bg-muted hover:border-primary/30 transition-colors relative z-10"
                    >
                      {v}
                      {rank !== undefined && (
                        <span className="text-muted-foreground font-medium italic">({rank})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isWinner && (
        <span className="absolute -top-2 -right-2 text-lg">🏆</span>
      )}
    </div>
  );
}

export default MatchPoll;
