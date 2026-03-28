import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { api, type Room } from "@/lib/api";
import { Users, Plus, LogIn, Copy, Check, Trophy, X, Trash2 } from "lucide-react";

/* ─── Skeleton card ─── */
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-border bg-gradient-card p-6 space-y-4">
    <div className="flex justify-between">
      <div className="h-7 w-28 rounded bg-muted/60" />
      <div className="h-5 w-20 rounded bg-muted/40" />
    </div>
    <div className="h-11 w-full rounded-lg bg-muted/40" />
    <div className="h-10 w-full rounded-xl bg-muted/60" />
  </div>
);

/* ─── Copy button ─── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-secondary" /> : <Copy size={13} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ─── Modal overlay ─── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-gradient-card shadow-2xl p-6 animate-slide-up">
        {children}
      </div>
    </div>
  );
}

/* ─── Main page ─── */
const Rooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  // Create state
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  // Join state
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const loadRooms = async () => {
    try {
      setRooms(await api.getMyRooms());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadRooms();
  }, [user, navigate]);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setCreating(true); setCreateError("");
    try {
      const room = await api.createRoom(roomName.trim());
      setCreatedRoom(room);
      loadRooms();
    } catch (e: any) {
      setCreateError(e.message || "Failed to create room");
    } finally { setCreating(false); }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete room "${room.name}"? All members will lose access.`)) return;
    try {
      await api.deleteRoom(room.id);
      setRooms(prev => prev.filter(r => r.id !== room.id));
    } catch (e: any) {
      alert(e.message || "Failed to delete room");
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true); setJoinError("");
    try {
      await api.joinRoom(inviteCode.trim());
      await loadRooms();
      closeModal();
    } catch (e: any) {
      setJoinError(e.message || "Invalid invite code");
    } finally { setJoining(false); }
  };

  const closeModal = () => {
    setModal(null);
    setRoomName(""); setCreateError(""); setCreatedRoom(null);
    setInviteCode(""); setJoinError("");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">

        {/* Title row */}
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-5xl text-gradient-gold sm:text-6xl">ROOMS</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your private prediction groups</p>
          </div>
          <div className="flex gap-2">
            <button
              id="join-room-btn"
              onClick={() => setModal("join")}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-colors"
            >
              <LogIn size={15} /> Join Room
            </button>
            <button
              id="create-room-btn"
              onClick={() => setModal("create")}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-display text-sm tracking-wider text-primary-foreground hover:brightness-110 transition-all glow-gold"
            >
              <Plus size={15} /> Create Room
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && rooms.length === 0 && (
          <div className="rounded-2xl border border-border bg-gradient-card p-12 text-center">
            <div className="text-6xl mb-4">🏏</div>
            <h3 className="font-display text-3xl text-foreground mb-2">No Rooms Yet</h3>
            <p className="text-muted-foreground mb-6 text-sm">Create a room or join one with an invite code.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setModal("join")} className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Join with Code
              </button>
              <button onClick={() => setModal("create")} className="rounded-xl bg-primary px-5 py-2.5 font-display text-sm tracking-wider text-primary-foreground hover:brightness-110 glow-gold">
                Create Room
              </button>
            </div>
          </div>
        )}

        {/* Room cards */}
        {!loading && rooms.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room, i) => (
              <div
                key={room.id}
                className="animate-slide-up rounded-2xl border border-border bg-gradient-card p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-2xl text-foreground leading-none">{room.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      <Users size={11} /> {room.member_count} member{room.member_count !== 1 ? "s" : ""}
                    </span>
                    {(user.is_admin || room.created_by === user.id) && (
                      <button
                        onClick={() => handleDelete(room)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete room"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Invite code */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Invite Code</p>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <code className="flex-1 font-mono text-sm font-bold text-foreground tracking-[0.25em]">{room.invite_code}</code>
                    <CopyBtn text={room.invite_code} />
                  </div>
                </div>

                <Link
                  to={`/rooms/${room.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 font-display text-sm tracking-wider text-primary hover:bg-primary/20 transition-colors"
                >
                  <Trophy size={14} /> VIEW LEADERBOARD
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Create Room Modal ── */}
      {modal === "create" && (
        <Modal onClose={closeModal}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-3xl text-gradient-gold">CREATE ROOM</h3>
            <button onClick={closeModal} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          {createdRoom ? (
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-display text-xl text-secondary mb-1">Room Created!</p>
              <p className="text-sm text-muted-foreground mb-5">Share this invite code with your friends.</p>
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 mb-5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{createdRoom.name} · Invite Code</p>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <code className="font-mono text-2xl font-bold text-foreground tracking-[0.3em]">{createdRoom.invite_code}</code>
                  <CopyBtn text={createdRoom.invite_code} />
                </div>
              </div>
              <Link
                to={`/rooms/${createdRoom.id}`}
                onClick={closeModal}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110 glow-gold"
              >
                <Trophy size={17} /> GO TO LEADERBOARD
              </Link>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Room Name</label>
              <input
                id="room-name-input"
                autoFocus
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Fantasy Kings"
                maxLength={30}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none transition-colors"
              />
              {createError && <p className="mt-1.5 text-xs text-destructive">{createError}</p>}
              <p className="mt-1.5 mb-5 text-[10px] text-muted-foreground">An invite code will be generated automatically.</p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button
                  id="create-room-submit"
                  onClick={handleCreate}
                  disabled={creating || !roomName.trim()}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-gold"
                >
                  {creating ? "…" : "CREATE"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Join Room Modal ── */}
      {modal === "join" && (
        <Modal onClose={closeModal}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-3xl text-gradient-gold">JOIN ROOM</h3>
            <button onClick={closeModal} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <label className="block text-sm text-muted-foreground mb-2">Invite Code</label>
          <input
            id="join-code-input"
            autoFocus
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            placeholder="e.g. STAGS1"
            maxLength={10}
            className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 font-mono text-lg font-bold text-foreground uppercase tracking-[0.25em] placeholder:text-muted-foreground/40 placeholder:font-normal placeholder:tracking-normal focus:border-primary/60 focus:outline-none transition-colors"
          />
          {joinError && <p className="mt-1.5 text-xs text-destructive">{joinError}</p>}
          <div className="mt-5 flex gap-3">
            <button onClick={closeModal} className="flex-1 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button
              id="join-room-submit"
              onClick={handleJoin}
              disabled={joining || !inviteCode.trim()}
              className="flex-1 rounded-xl bg-primary py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-gold"
            >
              {joining ? "…" : "JOIN"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Rooms;
