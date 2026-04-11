import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const JoinRoom = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // Store invite code in sessionStorage so Rooms page can pick it up after login
      if (inviteCode) sessionStorage.setItem("pendingInvite", inviteCode);
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    // Redirect to rooms page with invite code pre-filled
    navigate(`/rooms?invite=${encodeURIComponent(inviteCode || "")}`, { replace: true });
  }, [inviteCode, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
      <h2 className="font-display text-2xl text-foreground">Redirecting…</h2>
    </div>
  );
};

export default JoinRoom;
