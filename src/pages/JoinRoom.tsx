import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useRoom } from "@/lib/room";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

const JoinRoom = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const { refreshRooms, setActiveRoomId } = useRoom();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    const join = async () => {
      if (!inviteCode) return;
      try {
        const { room } = await api.joinRoom(inviteCode);
        await refreshRooms();
        setActiveRoomId(room.id);
        navigate("/");
      } catch (e: any) {
        setError(e.message || "Failed to join room");
      }
    };

    join();
  }, [inviteCode, user, navigate, refreshRooms, setActiveRoomId]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mb-6 text-6xl">❌</div>
        <h2 className="mb-2 font-display text-3xl text-foreground">Join Failed</h2>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate("/rooms")}
          className="rounded-xl bg-primary px-6 py-3 font-display text-lg tracking-wider text-primary-foreground hover:brightness-110"
        >
          BACK TO ROOMS
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
      <h2 className="font-display text-2xl text-foreground">Joining Room...</h2>
      <p className="text-muted-foreground">Please wait while we set things up.</p>
    </div>
  );
};

export default JoinRoom;
