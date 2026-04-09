import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { api, ChatMessage, User } from "@/lib/api";
import { connectSocket, getSocket } from "@/lib/socket";
import Header from "@/components/Header";
import { IPL_SCHEDULE, IPL_TEAMS } from "@/lib/data";
import { format } from "date-fns";

const ChatRoom: React.FC = () => {
  const { roomId, matchId } = useParams<{ roomId: string; matchId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const match = IPL_SCHEDULE.find((m) => m.id === matchId);
  const t1 = match ? IPL_TEAMS[match.team1] : null;
  const t2 = match ? IPL_TEAMS[match.team2] : null;

  useEffect(() => {
    const u = api.getStoredUser();
    if (!u) {
      navigate("/login");
      return;
    }
    setUser(u);

    // Load initial history
    if (roomId && matchId) {
      api.getChatHistory(Number(roomId), matchId).then(setMessages).catch(console.error);

      // Setup Socket
      const socket = connectSocket();
      socket.emit("join_chat", { roomId: Number(roomId), matchId });

      socket.on("new_message", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      return () => {
        socket.off("new_message");
        // We don't necessarily disconnect since it's a shared instance
      };
    }
  }, [roomId, matchId, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !matchId) return;

    const socket = getSocket();
    socket.emit("send_message", {
      roomId: Number(roomId),
      matchId,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  if (!match || !t1 || !t2) return null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      {/* Chat Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img src={t1.logo} alt={t1.short} className="h-8 w-8 rounded-full border-2 border-background bg-white p-1" />
              <img src={t2.logo} alt={t2.short} className="h-8 w-8 rounded-full border-2 border-background bg-white p-1" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-none">
                {t1.short} vs {t2.short} Live Chat
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Match in progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-chat-pattern"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40 space-y-2">
            <MessageCircle size={48} />
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user?.id === msg.user_id;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden border border-primary/20">
                  {msg.profile_pic ? (
                    <img src={msg.profile_pic} alt={msg.username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-primary">{msg.username.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-bold text-muted-foreground px-1 mb-1">
                    {isMe ? "You" : msg.username}
                  </span>
                  <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted text-foreground rounded-tl-none"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.created_at), "h:mm a")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="container max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-border bg-muted px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
