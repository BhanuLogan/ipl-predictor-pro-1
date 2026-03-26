import { useState } from "react";
import { IPL_TEAMS, type Match, formatMatchDate } from "@/lib/data";
import { Check, MapPin, Calendar } from "lucide-react";

interface MatchPollProps {
  match: Match;
  votes: Record<string, string>; // { username: prediction }
  result?: string;
  username: string;
  onVote: (matchId: string, prediction: string) => void;
  isOpen: boolean;
}

const MatchPoll = ({ match, votes, result, username, onVote, isOpen }: MatchPollProps) => {
  const myPick = votes[username] || null;
  const [selected, setSelected] = useState<string | null>(myPick);
  const [hasVoted, setHasVoted] = useState(!!myPick);

  const team1 = IPL_TEAMS[match.team1];
  const team2 = IPL_TEAMS[match.team2];
  const totalVotes = Object.keys(votes).length;
  const votesFor = (t: string) => Object.values(votes).filter(v => v === t).length;
  const pct = (t: string) => totalVotes === 0 ? 50 : Math.round((votesFor(t) / totalVotes) * 100);
  const isCompleted = !!result;

  const handleVote = () => {
    if (!selected) return;
    onVote(match.id, selected);
    setHasVoted(true);
  };

  return (
    <div className="animate-slide-up rounded-2xl bg-gradient-card border border-border p-6 shadow-xl">
      {/* Match info */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={14} />
          <span>{formatMatchDate(match.date, match.time)}</span>
        </div>
        {isCompleted && (
          <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-semibold text-secondary">
            Completed
          </span>
        )}
        {isOpen && !isCompleted && (
          <span className="animate-pulse-slow rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            Live Poll
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
        <MapPin size={12} />
        <span>{match.venue}</span>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
        <TeamButton
          team={team1}
          teamKey={match.team1}
          selected={selected === match.team1}
          disabled={hasVoted || isCompleted || !isOpen}
          isWinner={result === match.team1}
          onClick={() => setSelected(match.team1)}
          voteCount={votesFor(match.team1)}
          totalVotes={totalVotes}
          showVotes={hasVoted || isCompleted || totalVotes > 0}
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
          disabled={hasVoted || isCompleted || !isOpen}
          isWinner={result === match.team2}
          onClick={() => setSelected(match.team2)}
          voteCount={votesFor(match.team2)}
          totalVotes={totalVotes}
          showVotes={hasVoted || isCompleted || totalVotes > 0}
        />
      </div>

      {/* Result banner */}
      {isCompleted && (
        <div className="mb-4 rounded-xl bg-secondary/10 border border-secondary/20 p-3 text-center">
          <p className="text-sm text-secondary font-semibold">
            {result === "nr"
              ? "🌧️ No Result"
              : result === "draw"
              ? "🤝 Match Drawn"
              : `🏆 ${IPL_TEAMS[result]?.name || result} won!`}
          </p>
          {myPick && (
            <p className="text-xs text-muted-foreground mt-1">
              {result === "nr" || result === "draw"
                ? "You earned 2 points"
                : myPick === result
                ? "✅ You predicted correctly! +2 points"
                : "❌ Better luck next time!"}
            </p>
          )}
        </div>
      )}

      {/* Vote summary chips */}
      {totalVotes > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {Object.entries(votes).map(([name, pick]) => {
            const tc = IPL_TEAMS[pick];
            const won = result && (result === "nr" || result === "draw" || pick === result);
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{
                  backgroundColor: tc ? `${tc.color}20` : undefined,
                  color: tc?.color,
                  border: `1px solid ${tc ? `${tc.color}40` : 'transparent'}`,
                }}
              >
                {name}: {pick}
                {result && (won ? " ✓" : " ✗")}
              </span>
            );
          })}
        </div>
      )}

      {/* Vote button */}
      {!hasVoted && isOpen && !isCompleted && (
        <button
          onClick={handleVote}
          disabled={!selected}
          className="w-full rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed glow-gold"
        >
          LOCK IN PREDICTION
        </button>
      )}

      {hasVoted && !isCompleted && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          <Check size={16} className="text-secondary" />
          <span>
            You picked <strong className="text-foreground">{IPL_TEAMS[myPick!]?.short || myPick}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

function TeamButton({
  team,
  teamKey,
  selected,
  disabled,
  isWinner,
  onClick,
  voteCount,
  totalVotes,
  showVotes,
}: {
  team: { name: string; short: string; color: string; textColor: string };
  teamKey: string;
  selected: boolean;
  disabled: boolean;
  isWinner: boolean;
  onClick: () => void;
  voteCount: number;
  totalVotes: number;
  showVotes: boolean;
}) {
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-primary shadow-lg scale-[1.02]"
          : isWinner
          ? "border-secondary shadow-lg"
          : "border-border hover:border-muted-foreground/30"
      } ${disabled && !isWinner ? "opacity-70" : ""}`}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold"
        style={{ backgroundColor: team.color, color: team.textColor }}
      >
        {team.short.slice(0, 2)}
      </div>
      <span className="font-display text-xl text-foreground">{team.short}</span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{team.name}</span>

      {showVotes && (
        <div className="mt-1 w-full">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: team.color }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {voteCount} vote{voteCount !== 1 ? "s" : ""} ({percentage}%)
          </p>
        </div>
      )}

      {isWinner && (
        <span className="absolute -top-2 -right-2 text-lg">🏆</span>
      )}
    </button>
  );
}

export default MatchPoll;
