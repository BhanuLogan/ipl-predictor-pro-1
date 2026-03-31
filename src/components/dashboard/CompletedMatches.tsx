import React from "react";
import MatchPoll from "@/components/MatchPoll";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Match, MatchResult } from "@/lib/data";

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

const CompletedMatches = React.memo(({
  pastMatches,
  paginatedPast,
  pastPage,
  totalPastPages,
  setPastPage,
  voteCounts,
  myVotes,
  results,
  onVote
}: Props) => {
  if (pastMatches.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-4 font-display text-2xl text-foreground uppercase tracking-wide">
        📜 Completed Matches
      </h3>
      <div className="space-y-4">
        {paginatedPast.map(match => {
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
              onVote={onVote}
              isOpen={false}
            />
          );
        })}
      </div>
      
      {totalPastPages > 1 && (
        <div className="mt-6 border-t border-border/40 pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pastPage > 1) setPastPage(pastPage - 1);
                  }}
                  className={pastPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 text-xs font-medium text-muted-foreground">
                  Page {pastPage} of {totalPastPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pastPage < totalPastPages) setPastPage(pastPage + 1);
                  }}
                  className={pastPage === totalPastPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
});

CompletedMatches.displayName = "CompletedMatches";

export default CompletedMatches;
