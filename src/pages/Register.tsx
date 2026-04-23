import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.trim().length < 2 || username.trim().length > 20) {
      setError("Username must be 2-20 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-y-auto">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl animate-scale-in">
        <div className="rounded-2xl border border-border bg-gradient-card shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">

            {/* Left panel — branding (md+) */}
            <div className="hidden md:flex flex-col justify-between p-10 bg-primary/5 border-r border-border/50">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-5xl">🏏</span>
                  <div>
                    <h1 className="font-display text-3xl text-gradient-gold leading-none">IPL POLLS</h1>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-0.5">2026 Season</p>
                  </div>
                </div>
                <h2 className="font-display text-4xl text-foreground leading-tight mb-4">
                  JOIN THE<br />PREDICTION<br />GAME.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Create your account and start predicting IPL match winners. Compete with friends and climb the leaderboard.
                </p>
              </div>
              <div className="space-y-3 mt-8">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xl">🎯</span>
                  <span className="text-foreground">Correct prediction = <strong className="text-primary">2 points</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xl">🤝</span>
                  <span className="text-foreground">Draw / No Result = <strong className="text-secondary">1 point</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xl">🏆</span>
                  <span className="text-foreground">Climb the leaderboard!</span>
                </div>
              </div>
            </div>

            {/* Right panel — form */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              {/* Mobile header */}
              <div className="mb-6 text-center md:hidden">
                <span className="text-5xl">🏏</span>
                <h2 className="mt-3 font-display text-4xl text-gradient-gold">JOIN IPL POLLS</h2>
                <p className="mt-1 text-muted-foreground text-sm">Create your account & start predicting!</p>
              </div>

              {/* Desktop header */}
              <div className="hidden md:block mb-8">
                <h3 className="font-display text-3xl text-foreground">CREATE ACCOUNT</h3>
                <p className="text-sm text-muted-foreground mt-1">Join the game and start predicting!</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a display name"
                    className={inputCls}
                    required
                    autoFocus
                    maxLength={20}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">2–20 characters, visible to others</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={inputCls}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 font-display text-xl tracking-wider text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 glow-gold"
                >
                  {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>

              <div className="mt-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground/50">
                Made with ❤️ by <span className="font-bold text-primary/70">Manohar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
