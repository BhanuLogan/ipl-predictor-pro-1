import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Trophy, Vote, Shield, LogOut, Users, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import ProfileModal from "./ProfileModal";
import { getAvatarUrl } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const { user, logout, refreshUser } = useAuth();

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
    <>
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
            <div className="flex items-center gap-3 ml-2">
              <button
                onClick={() => setShowProfile(true)}
                className="group flex items-center gap-2 rounded-full border border-border bg-gradient-card p-1 pr-3 transition-colors hover:border-primary/50 text-left"
                title="Profile settings"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary overflow-hidden">
                  <img src={getAvatarUrl(user.profile_pic, user.username)} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{user.username}</span>
                  <Settings size={12} className="text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 hidden sm:block" />
                </div>
              </button>
              <button
                onClick={() => { logout(); window.location.href = "/login"; }}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={async (data) => {
            const api = (await import("@/lib/api")).api;
            await api.updateProfile(data);
            refreshUser();
            setShowProfile(false);
          }}
        />
      )}
    </>
  );
};

export default Header;
