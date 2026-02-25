import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { triggerGenerate } from "../api/client";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LessonView } from "../components/LessonView";
import { Sidebar } from "../components/Sidebar";
import { StatusBar } from "../components/StatusBar";
import { useSession } from "../hooks/useSession";
import { useSSE } from "../hooks/useSSE";
import { useSessionStore } from "../store/sessionStore";

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const storeSessionId = useSessionStore((s) => s.sessionId);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const { status, outline } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const generationTriggered = useRef(false);

  // Set sessionId in store if navigated directly
  useEffect(() => {
    if (sessionId && sessionId !== storeSessionId) {
      setSessionId(sessionId);
    }
  }, [sessionId, storeSessionId, setSessionId]);

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Сессия не найдена</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <StatusBar />

      <div className="flex min-h-0 flex-1">
        {/* Mobile sidebar toggle */}
        {outline && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed bottom-4 right-4 z-50 rounded-full bg-black p-3 text-white shadow-lg md:hidden"
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
          <aside
            className={`${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-gray-100 bg-gray-50/50 pt-14 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:pt-0`}
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
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
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
                <p className="text-lg text-gray-500">Анализируем ваш запрос...</p>
              </div>
            )}
            {status === "scaffolding" && !outline && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
                <p className="text-lg text-gray-500">Строим структуру программы...</p>
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
