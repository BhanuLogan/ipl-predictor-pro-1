import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { RoomProvider } from "@/lib/room";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PollPage from "./pages/PollPage";
import Rooms from "./pages/Rooms";
import RoomLeaderboard from "./pages/RoomLeaderboard";
import NotFound from "./pages/NotFound";
import JoinRoom from "./pages/JoinRoom";
import ChatRoom from "./pages/ChatRoom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoomProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/poll/:matchId" element={<PollPage />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:id" element={<RoomLeaderboard />} />
              <Route path="/rooms/:roomId/chat/:matchId" element={<ChatRoom />} />
              <Route path="/join/:inviteCode" element={<JoinRoom />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoomProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
