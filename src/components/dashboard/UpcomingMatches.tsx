import React from "react";
import { MapPin } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatMatchDate, IPL_TEAMS, type Match } from "@/lib/data";

interface Props {
  upcomingLocked: Match[];
  paginatedUpcoming: Match[];
  upcomingPage: number;
  totalUpcomingPages: number;
  setUpcomingPage: (page: number) => void;
}

const UpcomingMatches = React.memo(({
  upcomingLocked,
  paginatedUpcoming,
  upcomingPage,
  totalUpcomingPages,
  setUpcomingPage,
}: Props) => {
  if (upcomingLocked.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 font-display text-2xl text-foreground uppercase tracking-wide">
        📅 Upcoming Matches
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {paginatedUpcoming.map(match => (
          <div
            key={match.id}
            className="rounded-xl bg-gradient-card border border-border p-4 shadow-sm hover:border-primary/30 transition-all"
          >
            <p className="text-xs text-muted-foreground font-medium">
              {formatMatchDate(match.date, match.time)}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden bg-white shadow-sm border border-border/50"
                  style={IPL_TEAMS[match.team1]?.logo ? {} : { backgroundColor: IPL_TEAMS[match.team1]?.color, color: IPL_TEAMS[match.team1]?.textColor }}
                >
                  {IPL_TEAMS[match.team1]?.logo ? <img src={IPL_TEAMS[match.team1].logo} alt={match.team1} className="h-full w-full object-contain p-0.5" /> : match.team1.slice(0, 2)}
                </div>
                <span className="text-sm font-semibold text-foreground">{match.team1}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase mx-2">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{match.team2}</span>
                <div 
                  className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden bg-white shadow-sm border border-border/50"
                  style={IPL_TEAMS[match.team2]?.logo ? {} : { backgroundColor: IPL_TEAMS[match.team2]?.color, color: IPL_TEAMS[match.team2]?.textColor }}
                >
                  {IPL_TEAMS[match.team2]?.logo ? <img src={IPL_TEAMS[match.team2].logo} alt={match.team2} className="h-full w-full object-contain p-0.5" /> : match.team2.slice(0, 2)}
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium italic">
              <MapPin size={10} className="text-primary/70" />
              {match.venue.split(",")[0]}
            </p>
          </div>
        ))}
      </div>

      {totalUpcomingPages > 1 && (
        <div className="mt-6 border-t border-border/40 pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (upcomingPage > 1) setUpcomingPage(upcomingPage - 1);
                  }}
                  className={upcomingPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 text-xs font-medium text-muted-foreground">
                  Page {upcomingPage} of {totalUpcomingPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (upcomingPage < totalUpcomingPages) setUpcomingPage(upcomingPage + 1);
                  }}
                  className={upcomingPage === totalUpcomingPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
});

UpcomingMatches.displayName = "UpcomingMatches";

export default UpcomingMatches;
