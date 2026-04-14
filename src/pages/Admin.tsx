import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { IPL_TEAMS, formatMatchDate, isVotingLocked, getPollOpenMatches, type MatchResult, type Match } from "@/lib/data";
import { useMatches } from "@/lib/matches";
import { Check, CloudRain, Trash2, Users, Plus, Lock, Unlock, Timer, Settings2, Megaphone, Send, X, Bell } from "lucide-react";
import { type MatchOverride } from "@/lib/api";

const Admin = () => {
  const matches = useMatches();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const [votes, setVotes] = useState<Record<string, Record<string, string>>>({});
  const [adminPw, setAdminPw] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncingSchedule, setSyncingSchedule] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  // Add vote modal state
  const [addVoteModal, setAddVoteModal] = useState<{ matchId: string; team1: string; team2: string } | null>(null);
  const [addVoteUsername, setAddVoteUsername] = useState("");
  const [addVoteTeam, setAddVoteTeam] = useState("");
  const [addVoteLoading, setAddVoteLoading] = useState(false);
  const [addVoteError, setAddVoteError] = useState("");
  const [changePwUsername, setChangePwUsername] = useState("");
  const [changePwPassword, setChangePwPassword] = useState("");
  const [changePwStatus, setChangePwStatus] = useState("");
  const [overrides, setOverrides] = useState<Record<string, MatchOverride>>({});
  const [overrideLoading, setOverrideLoading] = useState<string | null>(null);
  const [botSettings, setBotSettings] = useState<Record<string, boolean>>({});
  const [announcementText, setAnnouncementText] = useState("");
  const [currentAnnouncement, setCurrentAnnouncement] = useState("");
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushLoading, setPushLoading] = useState(false);

  const loadData = async (roomId?: number) => {
    try {
      const actualRoomId = roomId ?? selectedRoomId;
      const [r, v, rms, ovs, ann, bots] = await Promise.all([
        api.getResults(),
        actualRoomId ? api.getVotes(actualRoomId) : Promise.resolve({}),
        user?.is_admin ? api.getAllRoomsAdmin() : Promise.resolve([]),
        api.getMatchOverrides(),
        api.getAnnouncement(),
        api.getMatchBotSettings(),
      ]);
      setResults(r);
      setVotes(v);
      const ovMap: Record<string, MatchOverride> = {};
      ovs.forEach((o: MatchOverride) => { ovMap[o.match_id] = o; });
      setOverrides(ovMap);
      const botMap: Record<string, boolean> = {};
      bots.forEach((b: { match_id: string; bot_enabled: boolean }) => { botMap[b.match_id] = b.bot_enabled; });
      setBotSettings(botMap);
      setCurrentAnnouncement(ann.text);
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

  const handleAddVote = async () => {
    if (!addVoteModal || !addVoteUsername.trim() || !addVoteTeam || !selectedRoomId) return;
    setAddVoteLoading(true);
    setAddVoteError("");
    try {
      await api.adminSetVote(addVoteModal.matchId, addVoteUsername.trim(), addVoteTeam, selectedRoomId);
      setAddVoteModal(null);
      setAddVoteUsername("");
      setAddVoteTeam("");
      await loadData();
    } catch (err: any) {
      setAddVoteError(err.message || "Failed to add vote");
    } finally {
      setAddVoteLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    setSyncingSchedule(true);
    try {
      const res = await api.syncSchedule();
      if (res.error) {
        alert("Schedule sync failed: " + res.error);
      } else {
        alert(`Schedule sync complete! Updated ${res.updated} ESPN event IDs.`);
      }
    } catch (err: any) {
      alert("Error syncing schedule: " + err.message);
    } finally {
      setSyncingSchedule(false);
    }
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
        const lines = [`Sync Complete!`, `Checked: ${res.checked} | Updated: ${res.updated}`];
        if (res.inProgress?.length) lines.push(`Still in progress: ${res.inProgress.join(', ')}`);
        if (res.notFound?.length) lines.push(`Not found on ESPN: ${res.notFound.join(', ')}`);
        if (res.checked === 0) lines.push(`(All past matches already have results)`);
        alert(lines.join('\n'));
        await loadData();
      }
    } catch (err: any) {
      alert("Error syncing: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleChangePassword = async () => {
    if (!changePwUsername.trim() || !changePwPassword) return;
    try {
      setChangePwStatus("Updating...");
      await api.adminSetPassword(changePwUsername.trim(), changePwPassword);
      setChangePwStatus("✅ Password updated successfully");
      setChangePwUsername("");
      setChangePwPassword("");
      setTimeout(() => setChangePwStatus(""), 3000);
    } catch (err: any) {
      setChangePwStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleSetOverride = async (matchId: string, manual_locked: boolean | null, lock_delay: number) => {
    setOverrideLoading(matchId);
    try {
      await api.setMatchOverride(matchId, manual_locked, lock_delay);
      await loadData();
    } catch (err: any) {
      alert("Failed to set override: " + err.message);
    } finally {
      setOverrideLoading(null);
    }
  };

  const handleToggleBot = async (matchId: string, enabled: boolean) => {
    setBotSettings(prev => ({ ...prev, [matchId]: enabled }));
    try {
      await api.setMatchBotSetting(matchId, enabled);
    } catch (err: any) {
      setBotSettings(prev => ({ ...prev, [matchId]: !enabled }));
      alert("Failed to update bot setting: " + err.message);
    }
  };

  const handleBroadcastAnnouncement = async () => {
    setAnnouncementLoading(true);
    try {
      await api.setAnnouncement(announcementText);
      await loadData();
      setAnnouncementText("");
    } catch (err: any) {
      alert("Failed to broadcast: " + err.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleClearAnnouncement = async () => {
    if (!confirm("Clear current broadcast?")) return;
    setAnnouncementLoading(true);
    try {
      await api.clearAnnouncement();
      await loadData();
    } catch (err: any) {
      alert("Failed to clear: " + err.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };
  
  const handleSendPush = async () => {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    if (!confirm("Send this push notification to ALL users?")) return;
    
    setPushLoading(true);
    try {
      await api.broadcastPushNotification(pushTitle.trim(), pushBody.trim());
      alert("✅ Global notification sent successfully!");
      setPushTitle("");
      setPushBody("");
    } catch (err: any) {
      alert("❌ Failed to send: " + err.message);
    } finally {
      setPushLoading(false);
    }
  };

  if (!user) return null;

  // Categorize matches: current/active polls (open, no result) and completed (has result)
  // Only show matches that are locked (started) or the current open poll — hide future upcoming
  const openPollIds = new Set(getPollOpenMatches(matches, results).map(m => m.id));
  const currentPolls = matches.filter(m => !results[m.id] && (isVotingLocked(m, overrides[m.id]) || openPollIds.has(m.id)));
  const completedMatches = matches.filter(m => results[m.id]).reverse();

  const renderMatch = (match: Match, i: number, index: number) => {
    const result = results[match.id];
    const team1 = IPL_TEAMS[match.team1];
    const team2 = IPL_TEAMS[match.team2];
    const matchVotes = votes[match.id] || {};
    const voteEntries = Object.entries(matchVotes);
    const override = overrides[match.id];
    const locked = isVotingLocked(match, override);

    return (
      <div
        key={match.id}
        className={`rounded-xl border p-4 ${
          result?.winner ? "border-secondary/30 bg-secondary/5" : locked ? "border-destructive/20 bg-destructive/5" : "border-primary/30 bg-primary/5"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Match {index + 1} · {formatMatchDate(match.date, match.time)}
            </span>
            {!result && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${locked ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary animate-pulse"}`}>
                {locked ? "🔒 Locked" : "🟢 Live Poll"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{voteEntries.length} votes</span>
            {!result && selectedRoomId && (
              <button
                onClick={() => setAddVoteModal({ matchId: match.id, team1: match.team1, team2: match.team2 })}
                className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                title="Add a user vote"
              >
                <Plus size={10} /> Add Vote
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden bg-white shadow-sm border border-border/50"
              style={team1.logo ? {} : { backgroundColor: team1.color, color: team1.textColor }}
            >
              {team1.logo ? <img src={team1.logo} alt={team1.short} className="h-full w-full object-contain p-1" /> : team1.short.slice(0, 2)}
            </div>
            <span className="font-semibold text-sm text-foreground">{team1.short}</span>
          </div>
          <span className="text-xs text-muted-foreground font-display">VS</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="font-semibold text-sm text-foreground">{team2.short}</span>
            <div
              className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden bg-white shadow-sm border border-border/50"
              style={team2.logo ? {} : { backgroundColor: team2.color, color: team2.textColor }}
            >
              {team2.logo ? <img src={team2.logo} alt={team2.short} className="h-full w-full object-contain p-1" /> : team2.short.slice(0, 2)}
            </div>
          </div>
        </div>

        {/* Override Controls */}
        {!result && (
          <div className="mb-4 rounded-lg bg-background/50 border border-border/50 p-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Settings2 size={12} />
                Match Controls
              </div>
              {overrideLoading === match.id && <span className="text-[10px] animate-pulse text-primary">Updating...</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-0.5 flex-1">
                {[
                  { label: "Auto", value: null, icon: Timer },
                  { label: "Lock", value: true, icon: Lock },
                  { label: "Open", value: false, icon: Unlock }
                ].map((opt) => {
                  const active = (override?.manual_locked ?? null) === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => handleSetOverride(match.id, opt.value as any, override?.lock_delay || 0)}
                      className={`flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <opt.icon size={10} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1 min-w-[100px]">
                <Timer size={10} className="text-muted-foreground" />
                <input
                  type="number"
                  placeholder="Delay"
                  value={override?.lock_delay || 0}
                  onChange={(e) => handleSetOverride(match.id, override?.manual_locked ?? null, parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-[10px] font-bold focus:outline-none"
                />
                <span className="text-[8px] font-bold text-muted-foreground">MIN</span>
              </div>
            </div>

            {/* Bot toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                🏏 Commentary Bot
              </span>
              <button
                onClick={() => handleToggleBot(match.id, !(botSettings[match.id] ?? true))}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all ${
                  (botSettings[match.id] ?? true)
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-border/50 hover:text-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${(botSettings[match.id] ?? true) ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                {(botSettings[match.id] ?? true) ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        )}

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
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">
            ADMIN PANEL
          </h2>
          <p className="mt-2 text-muted-foreground">
            Set match results &amp; manage votes 🛡️
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
              {/* Announcement Management */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-amber-500">
                  <Megaphone size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Live Broadcast Marquee</span>
                </div>
                
                {currentAnnouncement && (
                  <div className="mb-3 flex items-center justify-between gap-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <p className="text-[11px] font-bold text-amber-600 truncate flex-1 leading-tight">
                      Active: {currentAnnouncement}
                    </p>
                    <button
                      onClick={handleClearAnnouncement}
                      className="rounded-md p-1 text-amber-600 hover:bg-amber-500 hover:text-white transition-all"
                      title="Clear broadcast"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Type marquee message..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                    maxLength={150}
                  />
                  <button
                    onClick={handleBroadcastAnnouncement}
                    disabled={announcementLoading || !announcementText.trim()}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {announcementLoading ? "..." : "Broadcast"}
                  </button>
                </div>
              </div>

              {/* Global Push Notification */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-primary">
                  <Bell size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Global Push Notification</span>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="Notification Title (e.g. 🏏 Match Starting!)"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                  />
                  <textarea
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    placeholder="Notification Message... (keep it brief for best display)"
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                  <button
                    onClick={handleSendPush}
                    disabled={pushLoading || !pushTitle.trim() || !pushBody.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 glow-gold"
                  >
                    <Send size={16} />
                    {pushLoading ? "Sending..." : "SEND TO ALL SUBSCRIBERS"}
                  </button>
                </div>
              </div>

              {/* User Management Section */}
              <div className="rounded-xl border border-border bg-gradient-card p-4">
                <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">User Management - Reset Password</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={changePwUsername}
                    onChange={(e) => setChangePwUsername(e.target.value)}
                    placeholder="Username"
                    className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="password"
                    value={changePwPassword}
                    onChange={(e) => setChangePwPassword(e.target.value)}
                    placeholder="New password"
                    className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={!changePwUsername.trim() || !changePwPassword}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </div>
                {changePwStatus && <p className="mt-2 text-xs text-foreground">{changePwStatus}</p>}
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

            {/* Current / Active Polls Section */}
            {currentPolls.length > 0 && (
              <div className="mb-2">
                <h3 className="mb-3 font-display text-lg text-primary uppercase tracking-wide flex items-center gap-2">
                  <span className="animate-pulse">🟢</span> Current Poll
                </h3>
                <div className="space-y-3">
                  {currentPolls.map((match, i) => {
                    const scheduleIdx = matches.findIndex(m => m.id === match.id);
                    return renderMatch(match, i, scheduleIdx);
                  })}
                </div>
              </div>
            )}

            {/* Completed Matches Section */}
            {completedMatches.length > 0 && (
              <div>
                <div className="mb-3 mt-6 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg text-secondary uppercase tracking-wide flex items-center gap-2">
                    📜 Completed Matches
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncSchedule}
                      disabled={syncingSchedule}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                      title="Sync match ESPN IDs from ESPN API"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncingSchedule ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      {syncingSchedule ? "Syncing…" : "Sync Schedule"}
                    </button>
                    <button
                      onClick={handleSyncResults}
                      disabled={syncing}
                      className="flex items-center gap-1.5 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-[11px] font-bold text-secondary transition-all hover:bg-secondary/20 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncing ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      {syncing ? "Syncing…" : "Sync Results"}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {completedMatches.map((match, i) => {
                    const scheduleIdx = matches.findIndex(m => m.id === match.id);
                    return renderMatch(match, i, scheduleIdx);
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Vote Modal */}
      {addVoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setAddVoteModal(null); setAddVoteUsername(""); setAddVoteTeam(""); setAddVoteError(""); }} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-gradient-card shadow-2xl p-6 animate-slide-up">
            <h3 className="font-display text-2xl text-gradient-gold mb-1">ADD VOTE</h3>
            <p className="text-xs text-muted-foreground mb-5">
              {IPL_TEAMS[addVoteModal.team1]?.short} vs {IPL_TEAMS[addVoteModal.team2]?.short}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Username</label>
                <input
                  autoFocus
                  value={addVoteUsername}
                  onChange={e => setAddVoteUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Pick</label>
                <div className="grid grid-cols-2 gap-2">
                  {[addVoteModal.team1, addVoteModal.team2].map(teamKey => {
                    const team = IPL_TEAMS[teamKey];
                    return (
                      <button
                        key={teamKey}
                        onClick={() => setAddVoteTeam(teamKey)}
                        className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                          addVoteTeam === teamKey ? "border-primary shadow-lg" : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div
                          className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden bg-white shadow-sm border border-border/50"
                          style={team.logo ? {} : { backgroundColor: team.color, color: team.textColor }}
                        >
                          {team.logo ? <img src={team.logo} alt={team.short} className="h-full w-full object-contain p-1" /> : team.short.slice(0, 2)}
                        </div>
                        <span className="font-display text-sm text-foreground">{team.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {addVoteError && <p className="text-xs text-destructive">{addVoteError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setAddVoteModal(null); setAddVoteUsername(""); setAddVoteTeam(""); setAddVoteError(""); }}
                  className="flex-1 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVote}
                  disabled={addVoteLoading || !addVoteUsername.trim() || !addVoteTeam}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-gold"
                >
                  {addVoteLoading ? "..." : "ADD"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
