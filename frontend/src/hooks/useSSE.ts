import { useEffect, useRef } from "react";
import { connectSSE, type SSEConnection } from "../api/sse";
import { useSessionStore } from "../store/sessionStore";

export function useSSE(sessionId: string | null, onConnected?: () => void) {
  const handleEvent = useSessionStore((s) => s.handleEvent);
  const connectionRef = useRef<SSEConnection | null>(null);
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  useEffect(() => {
    if (!sessionId) return;

    // Close any previous connection
    connectionRef.current?.close();

    const connection = connectSSE(
      sessionId,
      (event) => {
        handleEvent(event);
      },
      (error) => {
        console.error("SSE connection error:", error);
      },
    );

    connectionRef.current = connection;

    // Signal that SSE is connected — caller can now trigger generation
    onConnectedRef.current?.();

    return () => {
      connection.close();
      connectionRef.current = null;
    };
  }, [sessionId, handleEvent]);
}
