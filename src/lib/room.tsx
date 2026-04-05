import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, type Room } from "./api";
import { useAuth } from "./auth";

interface RoomContextType {
  activeRoom: Room | null;
  rooms: Room[];
  loading: boolean;
  setActiveRoomId: (id: number) => void;
  refreshRooms: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setActiveRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const myRooms = await api.getMyRooms();
      setRooms(myRooms);

      // Restore active room from localStorage if it exists and is valid
      const storedId = localStorage.getItem("active_room_id");
      if (storedId) {
        const found = myRooms.find(r => r.id === parseInt(storedId));
        if (found) {
          setActiveRoom(found);
        } else {
          localStorage.removeItem("active_room_id");
          // If only one room, auto-select it
          if (myRooms.length === 1) {
            setActiveRoom(myRooms[0]);
            localStorage.setItem("active_room_id", myRooms[0].id.toString());
          }
        }
      } else if (myRooms.length === 1) {
        // Auto-select the only room
        setActiveRoom(myRooms[0]);
        localStorage.setItem("active_room_id", myRooms[0].id.toString());
      }
    } catch (e) {
      console.error("Failed to load rooms", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const setActiveRoomId = (id: number) => {
    const room = rooms.find(r => r.id === id);
    if (room) {
      setActiveRoom(room);
      localStorage.setItem("active_room_id", id.toString());
    }
  };

  return (
    <RoomContext.Provider value={{ activeRoom, rooms, loading, setActiveRoomId, refreshRooms }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be inside RoomProvider");
  return ctx;
}
