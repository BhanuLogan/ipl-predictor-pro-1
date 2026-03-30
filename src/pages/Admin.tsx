import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { IPL_SCHEDULE, IPL_TEAMS, formatMatchDate, type MatchResult } from "@/lib/data";
import { Check, CloudRain, Trash2, Users } from "lucide-react";

const Admin = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
  const [adminPw, setAdminPw] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const loadData = async (roomId?: number) => {
    try {
      const actualRoomId = roomId ?? selectedRoomId;
      const [r, v, rms] = await Promise.all([
        api.getResults(),
        actualRoomId ? api.getVotes(actualRoomId) : Promise.resolve({}),
        user?.is_admin ? api.getAllRoomsAdmin() : Promise.resolve([]),
      ]);
      setResults(r);
      setVotes(v);
      if (user?.is_admin) {
        setRooms(rms);
        if (!actualRoomId && rms.length > 0) {
          setSelectedRoomId(rms[0].id);
          // Re-fetch votes for the first room
          const v2 = await api.getVotes(rms[0].id);
          setVotes(v2);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user, navigate]);

  const handleUnlock = async () => {
    try {
      await api.unlockAdmin(adminPw);
      refreshUser();
      setError("");
    } catch (err: any) {
      setError(err.message || "Wrong password");
    }
  };

  const handleSetResult = async (matchId: string, winner: string | null) => {
    try {
      await api.setResult(matchId, winner);
      await loadData();
    } catch {}
  };

  const handleDeleteVote = async (matchId: string, username: string) => {
    if (!selectedRoomId) return;
    if (!confirm(`Delete ${username}'s vote for this match in this room?`)) return;
    try {
      await api.adminDeleteVote(matchId, username, selectedRoomId);
      await loadData();
    } catch {}
  };

  const handleReset = async () => {
    if (!confirm("RESET ALL votes and results? This cannot be undone!")) return;
    if (!confirm("Are you absolutely sure?")) return;
    try {
      await api.adminReset();
      await loadData();
    } catch {}
  };

  const handleSyncResults = async () => {
    setSyncing(true);
    try {
      const res = await api.syncResults();
      if (res.error) {
        alert("Sync Failed: " + res.error);
      } else {
        alert(`Sync Complete!\nChecked: ${res.checked} matches\nUpdated: ${res.updated} new results`);
        await loadData();
      }
    } catch (err: any) {
      alert("Error syncing: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            ADMIN PANEL
          </h2>
          <p className="mt-2 text-muted-foreground">
            Set match results & manage votes 🛡️
          </p>
        </div>

        {!user.is_admin ? (
          <div className="rounded-2xl bg-gradient-card border border-border p-8">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Enter the admin password to unlock
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminPw}
                onChange={(e) => setAdminPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Admin password"
                className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={handleUnlock}
                className="rounded-xl bg-primary px-6 py-3 font-display text-lg text-primary-foreground transition-all hover:brightness-110"
              >
                UNLOCK 🔓
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-destructive text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-secondary/10 border border-secondary/20 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-secondary">🛡️ Admin mode active</span>
                  <button
                    onClick={handleSyncResults}
                    disabled={syncing}
                    className={`rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50 ${syncing ? "animate-pulse" : ""}`}
                  >
                    {syncing ? "⌛ SYNCING..." : "🔄 SYNC FROM CRICBUZZ"}
                  </button>
                </div>
                <button
                  onClick={handleReset}
                  className="rounded-lg bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground hover:brightness-110"
                >
                  🗑️ RESET ALL DATA
                </button>
              </div>

              {/* Room Selector for Admin */}
              <div className="rounded-xl border border-border bg-gradient-card p-4">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <Users size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Manage Votes by Room</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        loadData(room.id);
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        selectedRoomId === room.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                  {rooms.length === 0 && <p className="text-xs text-muted-foreground italic">No rooms created yet.</p>}
                </div>
              </div>
            </div>

            {IPL_SCHEDULE.map((match, i) => {
              const result = results[match.id];
              const team1 = IPL_TEAMS[match.team1];
              const team2 = IPL_TEAMS[match.team2];
              const matchVotes = votes[match.id] || {};
              const voteEntries = Object.entries(matchVotes);

              return (
                <div
                  key={match.id}
                  className={`rounded-xl border p-4 ${
                    result?.winner ? "border-secondary/30 bg-secondary/5" : "border-border bg-gradient-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      Match {i + 1} · {formatMatchDate(match.date, match.time)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{voteEntries.length} votes</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: team1.color, color: team1.textColor }}
                      >
                        {team1.short.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-sm text-foreground">{team1.short}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-display">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-semibold text-sm text-foreground">{team2.short}</span>
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: team2.color, color: team2.textColor }}
                      >
                        {team2.short.slice(0, 2)}
                      </div>
                    </div>
                  </div>

                  {/* Show individual votes to admin */}
                  {voteEntries.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {voteEntries.map(([name, pick]) => {
                        const tc = IPL_TEAMS[pick];
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
                            <button
                              onClick={() => handleDeleteVote(match.id, name)}
                              className="ml-1 opacity-60 hover:opacity-100"
                              title="Delete this vote"
                            >
                              <Trash2 size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {result?.winner ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-secondary">
                          {result.winner === "nr"
                            ? "🌧️ No Result"
                            : result.winner === "draw"
                            ? "🤝 Tied"
                            : `🏆 ${IPL_TEAMS[result.winner]?.short} Won`}
                        </span>
                        <button
                          onClick={() => handleSetResult(match.id, null)}
                          className="text-xs text-destructive hover:underline shrink-0"
                        >
                          Reset
                        </button>
                      </div>
                      {result.scoreSummary ? (
                        <p className="text-[11px] leading-snug text-muted-foreground border-t border-border/40 pt-2">
                          {result.scoreSummary}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSetResult(match.id, match.team1)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Check size={12} />
                        {team1.short} Won
                      </button>
                      <button
                        onClick={() => handleSetResult(match.id, match.team2)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Check size={12} />
                        {team2.short} Won
                      </button>
                      <button
                        onClick={() => handleSetResult(match.id, "draw")}
                        className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                        title="Tied"
                      >
                        🤝
                      </button>
                      <button
                        onClick={() => handleSetResult(match.id, "nr")}
                        className="flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                        title="No Result"
                      >
                        <CloudRain size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
