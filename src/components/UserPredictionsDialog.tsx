import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { IPL_SCHEDULE, IPL_TEAMS, formatMatchDate } from "@/lib/data";

function outcomeLabel(outcome: string | null, prediction: string) {
  if (!outcome) return { emoji: "⏳", hint: "Result pending" };
  if (outcome === "nr" || outcome === "draw")
    return { emoji: "🤝", hint: "+1 pt (tie / no result)" };
  if (prediction === outcome) return { emoji: "✅", hint: "+2 pts · correct pick" };
  return { emoji: "❌", hint: "0 pts · wrong pick" };
}

type Props = {
  username: string | null;
  roomId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const UserPredictionsDialog = ({ username, roomId, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<
    { matchId: string; prediction: string; outcome: string | null }[]
  >([]);

  useEffect(() => {
    if (!open || !username) {
      setVotes([]);
      return;
    }
    setLoading(true);
    api
      .getUserPredictions(username, roomId || undefined)
      .then((r) => {
        const order = new Map(IPL_SCHEDULE.map((m, i) => [m.id, i]));
        const sorted = [...r.votes].sort(
          (a, b) => (order.get(a.matchId) ?? 999) - (order.get(b.matchId) ?? 999)
        );
        setVotes(sorted);
      })
      .catch(() => setVotes([]))
      .finally(() => setLoading(false));
  }, [open, username, roomId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-2 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {username ? `${username}'s picks` : "Predictions"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[min(70vh,440px)] pr-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : votes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No votes yet.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {votes.map((v) => {
                const match = IPL_SCHEDULE.find((m) => m.id === v.matchId);
                const { emoji, hint } = outcomeLabel(v.outcome, v.prediction);
                const pick = IPL_TEAMS[v.prediction]?.short ?? v.prediction;
                const line1 = match
                  ? `${formatMatchDate(match.date, match.time)} · ${match.team1} vs ${match.team2}`
                  : v.matchId;
                return (
                  <li
                    key={v.matchId}
                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {line1}
                        </p>
                        <p className="mt-1 text-foreground">
                          Picked{" "}
                          <span className="font-semibold text-primary">{pick}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
                      </div>
                      <span className="text-lg leading-none" aria-hidden>
                        {emoji}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserPredictionsDialog;
