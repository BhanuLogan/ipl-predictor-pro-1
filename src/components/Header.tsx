import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Trophy, Vote, Shield, LogOut, Users, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import ProfileModal from "./ProfileModal";

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = user?.is_admin
    ? [
        { path: "/rooms", label: "Rooms", icon: Users },
        { path: "/admin", label: "Admin", icon: Shield },
      ]
    : [
        { path: "/", label: "Polls", icon: Vote },
        { path: "/rooms", label: "Rooms", icon: Users },
        { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
      ];

  const [showProfile, setShowProfile] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">🏏</span>
          <div>
            <h1 className="font-display text-2xl leading-none text-gradient-gold">
              IPL POLLS 2026
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Predict & Win
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { logout(); window.location.href = "/login"; }}
              className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{user.username}</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
