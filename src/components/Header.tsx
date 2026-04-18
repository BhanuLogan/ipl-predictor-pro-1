import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Trophy, Vote, Shield, Users, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRoom } from "@/lib/room";
import ProfileModal from "./ProfileModal";
import { getAvatarUrl } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const { user, logout, refreshUser } = useAuth();
  const { activeRoom } = useRoom();
  const [showProfile, setShowProfile] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = user?.is_admin
    ? [
        { path: "/", label: "Polls", icon: Vote },
        { path: "/rooms", label: "Rooms", icon: Users },
        { path: activeRoom ? `/rooms/${activeRoom.id}` : "/rooms", label: "Leaderboard", icon: Trophy },
        { path: "/admin", label: "Admin", icon: Shield },
      ]
    : [
        { path: "/", label: "Polls", icon: Vote },
        { path: "/rooms", label: "Rooms", icon: Users },
        { path: activeRoom ? `/rooms/${activeRoom.id}` : "/rooms", label: "Leaderboard", icon: Trophy },
      ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-3xl">🏏</span>
            <div>
              <h1 className="font-display text-xl sm:text-2xl leading-none text-gradient-gold">
                IPL POLLS 2026
              </h1>
              <p className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground">
                Predict & Win
              </p>
            </div>
          </Link>

          {/* Desktop nav — md+ */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Avatar — always visible */}
            {user && (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center justify-center rounded-full border border-border bg-gradient-card p-1 transition-colors hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                title="Profile settings"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 overflow-hidden">
                  <img
                    src={getAvatarUrl(user.profile_pic, user.username)}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏏</span>
                <span className="font-display text-xl text-gradient-gold">IPL POLLS</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col p-3 gap-1 flex-1 overflow-y-auto custom-scrollbar">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>

            {/* User info footer */}
            {user && (
              <div className="p-4 border-t border-border shrink-0">
                <button
                  onClick={() => { setMobileOpen(false); setShowProfile(true); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/20 shrink-0">
                    <img
                      src={getAvatarUrl(user.profile_pic, user.username)}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                    <p className="text-[10px] text-muted-foreground">{user.is_admin ? "Admin" : "Player"} · View Profile</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={() => { logout(); window.location.href = "/login"; }}
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
