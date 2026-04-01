import React from "react";
import MatchPoll from "@/components/MatchPoll";
import { IPL_SCHEDULE, isVotingLocked, type Match } from "@/lib/data";
import { Coffee } from "lucide-react";


interface Props {
  openPolls: Match[];
  voteCounts: Record<string, Record<string, number>>;
  myVotes: Record<string, string>;
  allVotes: Record<string, Record<string, string>>;
  onVote: (matchId: string, prediction: string, isBulk?: boolean) => Promise<void>;
  completedCount: number;
  results: Record<string, any>;
}

const OpenPolls = React.memo(({ openPolls, voteCounts, myVotes, allVotes, onVote, completedCount, results }: Props) => {
  if (openPolls.length > 0) {
    return (
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <h2 className="font-display text-3xl text-gradient-gold">
            {openPolls.some(m => isVotingLocked(m))
              ? "LIVE MATCH IN PROGRESS"
              : `LIVE POLL${openPolls.length > 1 ? "S" : ""} — VOTE NOW!`}
          </h2>
          <a
            href="https://www.buymeacoffee.com/manoharcb"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#FFDD00] px-3 py-1.5 text-[10px] font-bold text-black hover:bg-[#FFDD00]/90 transition-all shadow-sm"
          >
            <Coffee size={12} fill="currentColor" />
            <span>Support Manohar</span>
          </a>
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
                onVote={onVote}
                isOpen
                allVotes={allVotes[match.id] || {}}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 text-center">
      <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl text-center">
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
        <div className="mt-6 flex justify-center">
          <a
            href="https://www.buymeacoffee.com/manoharcb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#FFDD00] px-6 py-3 text-sm font-bold text-black hover:bg-[#FFDD00]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <Coffee size={18} fill="currentColor" />
            <span>Buy Manohar a coffee ☕</span>
          </a>
        </div>
      </div>
    </div>
  );
});

OpenPolls.displayName = "OpenPolls";

export default OpenPolls;
