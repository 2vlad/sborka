import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSession, triggerGenerate } from "../api/client";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LessonView } from "../components/LessonView";
import { Sidebar } from "../components/Sidebar";
import { StatusBar } from "../components/StatusBar";
import { useResizable } from "../hooks/useResizable";
import { useSession } from "../hooks/useSession";
import { useSSE } from "../hooks/useSSE";
import { useSessionStore } from "../store/sessionStore";

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const storeSessionId = useSessionStore((s) => s.sessionId);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const hydrateFromSnapshot = useSessionStore((s) => s.hydrateFromSnapshot);
  const { status, outline } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebar = useResizable();
  const generationTriggered = useRef(false);
  const hydrationDone = useRef(false);

  // Set sessionId in store if navigated directly
  useEffect(() => {
    if (sessionId && sessionId !== storeSessionId) {
      setSessionId(sessionId);
    }
  }, [sessionId, storeSessionId, setSessionId]);

  // Hydrate from DB snapshot on mount
  useEffect(() => {
    if (!sessionId || hydrationDone.current) return;
    hydrationDone.current = true;

    fetchSession(sessionId).then((snapshot) => {
      if (!snapshot) return;
      // If session is already done or errored, hydrate from DB — no need to regenerate
      if (snapshot.status === "done" || snapshot.status === "error") {
        hydrateFromSnapshot(snapshot);
        generationTriggered.current = true; // prevent triggerGenerate
      } else if (snapshot.status === "generating") {
        // Generation in progress — hydrate what we have, SSE will pick up the rest
        hydrateFromSnapshot(snapshot);
      }
    });
  }, [sessionId, hydrateFromSnapshot]);

  // Trigger generation once SSE is connected
  const handleSSEConnected = useCallback(() => {
    if (sessionId && !generationTriggered.current) {
      generationTriggered.current = true;
      const skillLevel = useSessionStore.getState().skillLevel;
      triggerGenerate(sessionId, skillLevel).catch(console.error);
    }
  }, [sessionId]);

  // Connect SSE for the session
  useSSE(sessionId ?? null, handleSSEConnected);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-text-muted">Сессия не найдена</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      <StatusBar />

      <div className="flex min-h-0 flex-1">
        {/* Mobile sidebar toggle */}
        {outline && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed bottom-4 right-4 z-50 rounded-full bg-btn-primary p-3 text-btn-primary-text shadow-lg md:hidden"
            aria-label={sidebarOpen ? "Скрыть навигацию" : "Показать навигацию"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}

        {/* Sidebar */}
        {outline && (
          <>
            <aside
              className={`${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } fixed inset-y-0 left-0 z-40 max-w-[80vw] flex-shrink-0 transform overflow-y-auto border-r border-border bg-surface-alt/50 pt-14 transition-transform duration-200 ease-in-out md:relative md:max-w-none md:translate-x-0 md:pt-0`}
              style={{ width: sidebar.width }}
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </aside>

            {/* Resize handle — desktop only */}
            <div
              className="hidden md:flex"
              onPointerDown={sidebar.handlePointerDown}
              onPointerMove={sidebar.handlePointerMove}
              onPointerUp={sidebar.handlePointerUp}
              onDoubleClick={sidebar.resetWidth}
              style={{ touchAction: "none" }}
            >
              <div className="group flex w-1.5 cursor-col-resize items-center justify-center hover:bg-border/50 active:bg-border">
                <div className="h-8 w-0.5 rounded-full bg-border transition-colors group-hover:bg-text-placeholder group-active:bg-text-secondary" />
              </div>
            </div>
          </>
        )}

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && outline && (
          <div
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Breadcrumbs />
            {status === "classifying" && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 h-10 w-10 animate-spin-ease rounded-full border-4 border-surface-inset border-t-text-secondary" />
                <p className="text-lg text-text-muted">Анализируем ваш запрос...</p>
              </div>
            )}
            {status === "scaffolding" && !outline && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 h-10 w-10 animate-spin-ease rounded-full border-4 border-surface-inset border-t-text-secondary" />
                <p className="text-lg text-text-muted">Строим структуру программы...</p>
              </div>
            )}
            {(status === "generating" || status === "done" || outline) && (
              <LessonView />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
