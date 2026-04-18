import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";

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
      await login(username.trim(), password);
      sessionStorage.setItem("justLoggedIn", "true");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
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
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />
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
                  PREDICT.<br />COMPETE.<br />WIN.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pick the winner before every IPL match. Earn points, climb the leaderboard, and prove you know cricket.
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
                <h2 className="mt-3 font-display text-4xl text-gradient-gold">IPL POLLS 2026</h2>
                <p className="mt-1 text-muted-foreground text-sm">Sign in to predict match winners!</p>
              </div>

              {/* Desktop header */}
              <div className="hidden md:block mb-8">
                <h3 className="font-display text-3xl text-foreground">SIGN IN</h3>
                <p className="text-sm text-muted-foreground mt-1">Welcome back! Enter your credentials.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    className={inputCls}
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
                  {loading ? "SIGNING IN..." : "SIGN IN"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Register
                </Link>
              </p>

              {/* Mobile-only rules */}
              <div className="mt-6 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground md:hidden">
                <p className="font-semibold text-foreground mb-2">How it works:</p>
                <ul className="space-y-1.5">
                  <li>🎯 Correct prediction = <span className="font-bold text-primary">2 points</span></li>
                  <li>🤝 Draw / No Result = <span className="font-bold text-secondary">1 point</span></li>
                  <li>🏆 Climb the leaderboard!</li>
                </ul>
              </div>

              <div className="mt-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground/50">
                Made with ❤️ by <span className="font-bold text-primary/70">Manohar</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground/60">
          Note: Contact admin to change password or report any issues.
        </p>
      </div>
    </div>
  );
};

export default Login;
