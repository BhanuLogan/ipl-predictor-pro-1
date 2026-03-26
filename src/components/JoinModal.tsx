import { useState } from "react";
import { setUsername } from "@/lib/data";

const JoinModal = ({ onJoin }: { onJoin: () => void }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a username");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Username must be 2-20 characters");
      return;
    }
    setUsername(trimmed);
    onJoin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md animate-scale-in rounded-2xl bg-gradient-card border border-border p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <span className="text-6xl">🏏</span>
          <h2 className="mt-4 font-display text-4xl text-gradient-gold">
            IPL POLLS 2026
          </h2>
          <p className="mt-2 text-muted-foreground">
            Predict match winners & compete with your friends!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Choose your username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter username..."
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
              maxLength={20}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 font-display text-xl tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] glow-gold"
          >
            JOIN THE GAME
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How it works:</p>
          <ul className="mt-2 space-y-1">
            <li>🎯 Predict the winner for each match</li>
            <li>✅ Correct prediction = <span className="font-bold text-primary">2 points</span></li>
            <li>🤝 Draw/No Result = <span className="font-bold text-secondary">1 point</span> for all</li>
            <li>🏆 Climb the leaderboard!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JoinModal;
