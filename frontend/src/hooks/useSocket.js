import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getToken } from "../utils/token";

/**
 * useSocket Hook
 *
 * Custom React hook that manages a WebSocket connection to a Socket.io server namespace.
 * - Authenticates the socket handshake with the user's current JWT token.
 * - Automatically initializes the socket client on mount.
 * - Cleans up and disconnects the socket when the component unmounts or namespace changes.
 *
 * @param {string} namespace - WebSocket namespace to connect to (defaults to "/chat")
 * @returns {React.MutableRefObject<Socket|null>} Ref object pointing to the active Socket.io instance
 */
export function useSocket(namespace = "/chat") {
  // Holds reference to the persistent socket instance
  const socket = useRef(null);

  useEffect(() => {
    const token = getToken();

    // Do not attempt connection if user is not authenticated
    if (!token) return undefined;

    // Establish WebSocket connection with JWT authentication token in handshake
    socket.current = io(`${import.meta.env.VITE_API_URL}${namespace}`, {
      auth: { token },
    });

    // Cleanup: disconnect socket when unmounting or if namespace changes
    return () => {
      socket.current?.disconnect();
    };
  }, [namespace]);

  return socket;
}

