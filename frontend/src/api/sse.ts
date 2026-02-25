import type { SSEEvent } from "../types/events";

const EVENT_TYPES = [
  "session_created",
  "classification_ready",
  "outline_ready",
  "lesson_scaffold_ready",
  "block_started",
  "block_delta",
  "block_ready",
  "asset_reserved",
  "asset_ready",
  "error",
  "done",
  "plan_node_status",
] as const;

export interface SSEConnection {
  close: () => void;
}

export function connectSSE(
  sessionId: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Event) => void,
): SSEConnection {
  const url = `/api/sessions/${sessionId}/events`;
  const eventSource = new EventSource(url);

  for (const eventType of EVENT_TYPES) {
    eventSource.addEventListener(eventType, (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as SSEEvent;
        onEvent(parsed);
      } catch {
        console.error(`Failed to parse SSE event "${eventType}":`, e.data);
      }
    });
  }

  eventSource.onerror = (e) => {
    if (onError) {
      onError(e);
    }
    // EventSource auto-reconnects by default.
    // If the connection is permanently closed (readyState === CLOSED), clean up.
    if (eventSource.readyState === EventSource.CLOSED) {
      eventSource.close();
    }
  };

  return {
    close: () => {
      eventSource.close();
    },
  };
}
