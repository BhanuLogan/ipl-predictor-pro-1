import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      // After login, check if user has rooms - if they have exactly one, auto-select and go to polls
      if (!user?.is_admin) {
        try {
          const rooms = await api.getMyRooms();
          if (rooms.length === 1) {
            localStorage.setItem("active_room_id", rooms[0].id.toString());
          }
        } catch {}
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
            Sign in to predict match winners!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 font-display text-xl tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 glow-gold"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </p>

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

export default Login;
