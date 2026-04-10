import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle, X } from "lucide-react";
import { api, ChatMessage, MessageReaction, User } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import Header from "@/components/Header";
import { IPL_SCHEDULE, IPL_TEAMS } from "@/lib/data";
import { format } from "date-fns";

const REACTION_EMOJIS = ["🔥", "👏", "😮", "💔", "😂", "🏏", "4️⃣", "6️⃣"];

const BOT_COMMANDS = [
  { cmd: 'score',   desc: 'Current score & status' },
  { cmd: 'batting', desc: "Who's at the crease" },
  { cmd: 'bowling', desc: 'Current bowler stats' },
  { cmd: 'rr',      desc: 'Current run rate' },
  { cmd: 'target',  desc: 'Target score' },
  { cmd: 'rrr',     desc: 'Required run rate' },
  { cmd: 'overs',   desc: 'Overs remaining' },
  { cmd: 'toss',    desc: 'Toss result' },
  { cmd: 'result',  desc: 'Final match result' },
  { cmd: 'help',    desc: 'Show all commands' },
];

// ── Reaction bar (shown below bot messages) ──────────────────────────────────
const ReactionBar = ({
  messageId,
  reactions,
  currentUserId,
  onReact,
}: {
  messageId: number;
  reactions: MessageReaction[];
  currentUserId?: number;
  onReact: (messageId: number, emoji: string) => void;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    if (pickerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const hasReacted = (emoji: string) =>
    reactions.find((r) => r.emoji === emoji)?.userIds?.includes(currentUserId!) ?? false;

  const active = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Existing reactions — horizontal scroll, no wrap */}
      {active.length > 0 && (
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none max-w-[220px]">
          {active.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onReact(messageId, r.emoji)}
              className={`flex-shrink-0 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] border transition-all ${
                hasReacted(r.emoji)
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/50 border-border/40 text-foreground hover:bg-muted"
              }`}
            >
              <span className="leading-none">{r.emoji}</span>
              <span className="font-semibold tabular-nums">{r.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction picker */}
      <div className="relative flex-shrink-0" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((p) => !p)}
          className="h-5 w-5 flex items-center justify-center rounded-full border border-border/50 bg-muted/40 text-[10px] text-muted-foreground hover:bg-muted transition-all leading-none"
          title="Add reaction"
        >
          +
        </button>
        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 grid grid-cols-4 gap-1 bg-card border border-border rounded-xl p-1.5 shadow-xl z-20 w-max">
            {REACTION_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { onReact(messageId, e); setPickerOpen(false); }}
                className="hover:scale-125 transition-transform text-base leading-none p-0.5"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Bot message card ─────────────────────────────────────────────────────────
const BotMessage = ({
  msg,
  reactions,
  currentUserId,
  onReact,
}: {
  msg: ChatMessage;
  reactions: MessageReaction[];
  currentUserId?: number;
  onReact: (messageId: number, emoji: string) => void;
}) => {
  const isIntro = msg.message.startsWith("Hey everyone") ||
    msg.message.startsWith("Helloooo") ||
    msg.message.startsWith("Hi fam") ||
    msg.message.startsWith("Greetings") ||
    msg.message.startsWith("What's up");

  return (
    <div className="flex gap-2.5 mt-4">
      {/* Bot avatar */}
      <div className="h-8 w-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-amber-500/40 shadow-sm">
        <img src="/bot-avatar.svg" alt="bot" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col max-w-[85%] sm:max-w-[72%]">
        {/* Name + time */}
        <div className="flex items-center gap-1.5 px-1 mb-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
            {msg.bot_name || "ScoreBot"}
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            {format(new Date(msg.created_at), "h:mm a")}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl rounded-tl-none px-4 py-2.5 ${
            isIntro
              ? "bg-amber-500/10 border border-amber-500/25 shadow-sm"
              : "bg-muted/50 border border-border/40"
          }`}
        >
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">
            {msg.message}
          </p>
        </div>

        {/* Reactions */}
        <div className="mt-1 pl-1">
          <ReactionBar
            messageId={msg.id}
            reactions={reactions}
            currentUserId={currentUserId}
            onReact={onReact}
          />
        </div>
      </div>
    </div>
  );
};

// ── Main ChatRoom ─────────────────────────────────────────────────────────────
const ChatRoom: React.FC = () => {
  const { roomId, matchId } = useParams<{ roomId: string; matchId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [reactions, setReactions] = useState<Record<number, MessageReaction[]>>({});
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [suggestions, setSuggestions] = useState<typeof BOT_COMMANDS>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const match = IPL_SCHEDULE.find((m) => m.id === matchId);
  const t1 = match ? IPL_TEAMS[match.team1] : null;
  const t2 = match ? IPL_TEAMS[match.team2] : null;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Merge reactions from a message list into state
  const mergeReactions = useCallback((msgs: ChatMessage[]) => {
    const map: Record<number, MessageReaction[]> = {};
    for (const m of msgs) {
      if (m.reactions && m.reactions.length > 0) map[m.id] = m.reactions;
    }
    setReactions((prev) => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    const u = api.getStoredUser();
    if (!u) { navigate("/login"); return; }
    setUser(u);

    if (!roomId || !matchId) return;

    // Load history + bot setting
    api.getChatHistory(Number(roomId), matchId).then((msgs) => {
      setMessages(msgs);
      mergeReactions(msgs);
    }).catch(console.error);

    api.getMatchBotSettings().then((settings) => {
      const s = settings.find((s) => s.match_id === matchId);
      setBotEnabled(s ? s.bot_enabled : true);
    }).catch(console.error);

    // Socket setup
    const socket = connectSocket();
    socket.emit("join_chat", { roomId: Number(roomId), matchId });

    socket.on("new_message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      if (message.reactions) mergeReactions([message]);
    });

    socket.on("online_users", (users: any[]) => setOnlineUsers(users));

    socket.on("reaction_update", ({ messageId, reactions: updated }: {
      messageId: number;
      reactions: MessageReaction[];
    }) => {
      setReactions((prev) => ({ ...prev, [messageId]: updated }));
    });

    socket.on("bot_settings_update", ({ matchId: mid, bot_enabled }: { matchId: string; bot_enabled: boolean }) => {
      if (mid === matchId) setBotEnabled(bot_enabled);
    });

    return () => {
      socket.off("new_message");
      socket.off("online_users");
      socket.off("reaction_update");
      socket.off("bot_settings_update");
    };
  }, [roomId, matchId, navigate, mergeReactions]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Auto-suggest bot commands when user types /
  useEffect(() => {
    if (!newMessage.startsWith('/') || !botEnabled) {
      setSuggestions([]);
      setSelectedSuggestion(-1);
      return;
    }
    const typed = newMessage.slice(1).toLowerCase(); // everything after '/'
    const filtered = typed === ''
      ? BOT_COMMANDS
      : BOT_COMMANDS.filter((c) => c.cmd.startsWith(typed));
    setSuggestions(filtered);
    setSelectedSuggestion(-1);
  }, [newMessage, botEnabled]);

  const applySuggestion = useCallback((cmd: string) => {
    setNewMessage(`/${cmd}`);
    setSuggestions([]);
    setSelectedSuggestion(-1);
    inputRef.current?.focus();
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (selectedSuggestion >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestion].cmd);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !matchId) return;
    const socket = getSocket();
    socket.emit("send_message", {
      roomId: Number(roomId),
      matchId,
      message: newMessage.trim(),
      replyToId: replyingTo?.id,
    });
    setNewMessage("");
    setReplyingTo(null);
    setSuggestions([]);
    setSelectedSuggestion(-1);
  };

  const handleReact = useCallback(async (messageId: number, emoji: string) => {
    if (!user) return;
    // Optimistic update
    setReactions((prev) => {
      const current = prev[messageId] || [];
      const existing = current.find((r) => r.emoji === emoji);
      const alreadyReacted = existing?.userIds?.includes(user.id) ?? false;
      if (alreadyReacted) {
        return {
          ...prev,
          [messageId]: current
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count - 1,
                    userIds: (r.userIds ?? []).filter((id) => id !== user.id),
                    usernames: (r.usernames ?? []).filter((n) => n !== user.username),
                  }
                : r
            )
            .filter((r) => r.count > 0),
        };
      }
      return {
        ...prev,
        [messageId]: existing
          ? current.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count + 1,
                    userIds: [...(r.userIds ?? []), user.id],
                    usernames: [...(r.usernames ?? []), user.username],
                  }
                : r
            )
          : [...current, { emoji, count: 1, userIds: [user.id], usernames: [user.username] }],
      };
    });
    // Sync with server
    api.toggleReaction(messageId, emoji).catch(console.error);
  }, [user]);

  if (!match || !t1 || !t2) return null;

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      <Header />

      {/* Chat Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 overflow-hidden">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex -space-x-2 flex-shrink-0">
              <img src={t1.logo} alt={t1.short} className="h-8 w-8 rounded-full border-2 border-background bg-white p-1" />
              <img src={t2.logo} alt={t2.short} className="h-8 w-8 rounded-full border-2 border-background bg-white p-1" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-display text-base font-bold leading-none truncate">
                {t1.short} vs {t2.short}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Live Chat</span>
                <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                  botEnabled
                    ? "text-primary border-primary/30 bg-primary/10"
                    : "text-muted-foreground border-border/40 bg-muted/40"
                }`}>
                  <span className={`h-1 w-1 rounded-full ${botEnabled ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
                  Bot {botEnabled ? "On" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Online Users */}
        <div className="flex items-center gap-1 pl-4 border-l border-border/50 overflow-hidden max-w-[40%] sm:max-w-[50%]">
          <div className="flex -space-x-2 overflow-hidden items-center">
            {onlineUsers.slice(0, 3).map((u, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden ring-1 ring-primary/10"
                title={u.username}
              >
                {u.profile_pic ? (
                  <img src={u.profile_pic} alt={u.username} className="h-full w-full object-cover" />
                ) : (
                  <span>{u.username.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground ring-1 ring-border">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>
          {onlineUsers.length === 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">Offline</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-chat-pattern"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40 space-y-2">
            <MessageCircle size={48} />
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Bot message
            if (msg.is_bot || msg.bot_name) {
              return (
                <BotMessage
                  key={msg.id}
                  msg={msg}
                  reactions={reactions[msg.id] || []}
                  currentUserId={user?.id}
                  onReact={handleReact}
                />
              );
            }

            // Regular user message
            const isMe = user?.id === msg.user_id;
            const isBotCommand = /^\/[a-zA-Z]/.test(msg.message);
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMsg?.user_id === msg.user_id && !prevMsg?.is_bot && !prevMsg?.bot_name;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${isConsecutive ? "mt-1" : "mt-4"}`}
              >
                {!isConsecutive ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden border border-primary/20">
                    {msg.profile_pic ? (
                      <img src={msg.profile_pic} alt={msg.username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">{msg.username.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                <div className={`flex flex-col group max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isConsecutive && (
                    <span className="text-[10px] font-bold text-muted-foreground px-1 mb-1">
                      {isMe ? "You" : msg.username}
                    </span>
                  )}
                  <div
                    onClick={() => setReplyingTo(msg)}
                    className={`relative cursor-pointer transition-all active:scale-[0.99] rounded-2xl px-3 py-2 shadow-sm ${
                      isBotCommand
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-tr-none font-mono text-xs"
                        : isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.reply_to_message && (
                      <div className={`mb-2 rounded-lg border-l-4 bg-black/10 px-2 py-1.5 text-[11px] ${
                        isMe ? "border-primary-foreground/50" : "border-primary/50"
                      }`}>
                        <p className="font-bold opacity-80">{msg.reply_to_message.username}</p>
                        <p className="line-clamp-1 opacity-70">{msg.reply_to_message.message}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words flex-1 min-w-[50px]">{msg.message}</p>
                      <span className={`text-[9px] whitespace-nowrap opacity-60 ml-auto pb-0.5 ${isMe ? "text-primary-foreground" : "text-muted-foreground"}`}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  <ReactionBar
                    messageId={msg.id}
                    reactions={reactions[msg.id] || []}
                    currentUserId={user?.id}
                    onReact={handleReact}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="container max-w-2xl mx-auto flex flex-col gap-2">
          {replyingTo && (
            <div className="flex items-center justify-between rounded-xl bg-muted/80 px-4 py-2 border-l-4 border-primary animate-in slide-in-from-bottom-2 duration-200 shadow-inner">
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Replying to {replyingTo.username}</p>
                <p className="text-xs text-muted-foreground truncate opacity-80">{replyingTo.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-background rounded-full transition-colors ml-2"
              >
                <ArrowLeft size={16} className="rotate-90" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={replyingTo ? "Type your reply..." : botEnabled ? "Chat or /score, /batting, /help..." : "Type a message..."}
              className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="flex items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale px-4 h-11 min-w-[44px] sm:min-w-[64px]"
            >
              <Send size={18} className="sm:mr-2" />
              <span className="hidden sm:inline font-bold text-sm tracking-wide">Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bot command sidebar */}
      {suggestions.length > 0 && matchId && (
        <>
          {/* Backdrop (mobile only) */}
          <div
            className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            onClick={() => { setSuggestions([]); setSelectedSuggestion(-1); }}
          />
          <div className="fixed inset-y-0 right-0 z-40 flex flex-col w-64 bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40 flex-shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Bot commands
              </span>
              <button
                onClick={() => { setSuggestions([]); setSelectedSuggestion(-1); }}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {suggestions.map((s, i) => (
                <button
                  key={s.cmd}
                  onMouseDown={(e) => { e.preventDefault(); applySuggestion(s.cmd); }}
                  className={`w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    i === selectedSuggestion
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <code className="text-[11px] font-mono font-bold text-amber-400">
                    /{s.cmd}
                  </code>
                  <span className="text-[11px] text-muted-foreground leading-snug">{s.desc}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex-shrink-0">
              <p className="text-[9px] text-muted-foreground">↑↓ navigate · Tab / Enter to pick · Esc to close</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
