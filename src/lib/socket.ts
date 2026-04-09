import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("VITE_API_URL is required in the frontend .env file");
}

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem("ipl_token");
    socket = io(API_URL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const token = localStorage.getItem("ipl_token");
  if (s.auth) {
    (s.auth as any).token = token;
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
