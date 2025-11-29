import { io } from "socket.io-client";

let socket;

/**
 * Initializes and returns the Socket.io client instance.
 * Ensures the Next.js API route for the socket server is hit first.
 *
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Socket>}
 */
export const initSocket = async (userId) => {
  // If socket already exists and is connected, reuse it
  if (socket && socket.connected) {
    return socket;
  }

  try {
    // 1. "Wake up" the socket server (Next.js specific requirement for custom servers)
    await fetch("/api/socket");

    // 2. Initialize the client
    socket = io(undefined, {
      path: "/api/socket_io",
      addTrailingSlash: false,
      transports: ["websocket", "polling"], // Try WebSocket first
      query: {
        userId,
        model: "User", // Identifies this client as a "User" (vs Expert)
      },
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection Error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    return socket;
  } catch (error) {
    console.error("[Socket] Init failed:", error);
    return null;
  }
};

/**
 * Returns the active socket instance if it exists.
 */
export const getSocket = () => socket;

/**
 * Manually disconnects the socket (e.g., on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[Socket] Manually disconnected");
  }
};