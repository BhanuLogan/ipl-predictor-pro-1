import React from "react";
import { X, Trophy, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle } from "lucide-react";
import { PollSummary } from "@/lib/api";
import { IPL_TEAMS } from "@/lib/data";

interface PollSummaryBannerProps {
  summary: PollSummary;
  onClose: () => void;
}

const PollSummaryBanner: React.FC<PollSummaryBannerProps> = ({ summary, onClose }) => {
  if (summary.noData) return null;

  const {
    team1,
    team2,
    winner,
    scoreSummary,
    userStatus,
    pointsGained,
    currentRank,
    prevRank,
    rankChange,
  } = summary;

  const t1 = IPL_TEAMS[team1];
  const t2 = IPL_TEAMS[team2];
  const winnerTeam = winner === "draw" || winner === "nr" ? null : IPL_TEAMS[winner];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-primary/20 bg-gradient-card shadow-2xl animate-in zoom-in-95 duration-500">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-background/50 p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hero Section */}
          <div className="relative bg-primary/10 px-8 pt-10 pb-6 text-center border-b border-primary/10">
            <div className="absolute inset-0 bg-grid-white/5" />
            <div className="relative">
              <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary">Last Match Result</h2>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-2 ring-primary/20">
                    <img src={t1.logo} alt={t1.short} className="h-full w-full object-contain" />
                  </div>
                  <span className="font-display text-xs font-bold">{t1.short}</span>
                  {summary.team1Score && summary.team1Score.runs !== null && (
                    <div className="mt-1 flex flex-col items-center">
                      <span className="font-display text-sm font-black text-gradient-gold">
                        {summary.team1Score.runs}/{summary.team1Score.wickets}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">({summary.team1Score.overs})</span>
                    </div>
                  )}
                </div>
                <div className="font-display text-2xl italic text-muted-foreground/50">VS</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-2 ring-primary/20">
                    <img src={t2.logo} alt={t2.short} className="h-full w-full object-contain" />
                  </div>
                  <span className="font-display text-xs font-bold">{t2.short}</span>
                  {summary.team2Score && summary.team2Score.runs !== null && (
                    <div className="mt-1 flex flex-col items-center">
                      <span className="font-display text-sm font-black text-gradient-gold">
                        {summary.team2Score.runs}/{summary.team2Score.wickets}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">({summary.team2Score.overs})</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <p className="font-display text-2xl font-black text-gradient-gold">
                  {winner === "nr" ? "NO RESULT" : winner === "draw" ? "MATCH TIED" : `${winnerTeam?.name} WON!`}
                </p>
                {scoreSummary && <p className="mt-1 text-sm text-muted-foreground">{scoreSummary}</p>}
              </div>
            </div>
          </div>

          {/* User Status Section */}
          <div className="px-8 py-6">
            <div className={`flex items-center justify-between rounded-2xl border p-4 ${
              userStatus === 'won' ? 'border-green-500/20 bg-green-500/5' : 
              userStatus === 'lost' ? 'border-red-500/20 bg-red-500/5' : 
              'border-muted bg-muted/20'
            }`}>
              <div className="flex items-center gap-3">
                {userStatus === 'won' ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : userStatus === 'lost' ? (
                  <AlertCircle className="text-red-400" size={24} />
                ) : (
                  <Minus className="text-muted-foreground" size={24} />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {userStatus === 'won' ? "You Predicted Right!" : 
                     userStatus === 'lost' ? "Tough Luck This Time!" : 
                     "You missed this poll"}
                  </p>
                  <div className="flex items-center gap-2">
                     <p className="text-xs text-muted-foreground">
                      {pointsGained > 0 ? `+${pointsGained} Points earned` : "No points earned"}
                    </p>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <p className="text-xs font-bold text-primary">Rank #{currentRank}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  {rankChange > 0 ? (
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                      <TrendingUp size={14} /> UP {rankChange}
                    </div>
                  ) : rankChange < 0 ? (
                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
                      <TrendingDown size={14} /> DOWN {Math.abs(rankChange)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-bold">
                      <Minus size={14} /> NO CHANGE
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Community Impact Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Trophy size={16} className="text-primary" />
                  <span>COMMUNITY IMPACT</span>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{summary.userOutcomes.length} Participants</span>
              </div>

              <div className="space-y-2">
                {summary.userOutcomes.sort((a, b) => b.rankChange - a.rankChange).map((outcome) => (
                  <div key={outcome.username} className="flex items-center justify-between rounded-xl bg-muted/30 p-3 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${outcome.status === 'won' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400 opacity-50'}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-none">{outcome.username}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-tighter">
                          Picked {outcome.prediction}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase leading-none mb-1">Rank</p>
                        <p className="text-xs font-bold text-foreground">#{outcome.currentRank}</p>
                      </div>
                      <div className="w-16 flex justify-end">
                        {outcome.rankChange > 0 ? (
                          <div className="flex items-center gap-0.5 text-green-500 text-[10px] font-bold">
                            <TrendingUp size={12} /> {outcome.rankChange}
                          </div>
                        ) : outcome.rankChange < 0 ? (
                          <div className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold">
                            <TrendingDown size={12} /> {Math.abs(outcome.rankChange)}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-[10px] font-bold">-</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted px-8 py-5 text-center border-t border-border/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-gold"
          >
            CONTINUE TO PREDICTIONS
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollSummaryBanner;
