import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../api/client";
import { useSessionStore } from "../store/sessionStore";
import { useTheme } from "../hooks/useTheme";

const EXAMPLES = [
  "хочу разобраться в модулях JavaScript",
  "как работает React под капотом",
  "основы машинного обучения с нуля",
  "разобраться в SQL и проектировании баз данных",
  "научиться писать чистый код на Python",
];

export default function LandingPage() {
  const [request, setRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reset = useSessionStore((s) => s.reset);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (request) return;
    intervalRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setExampleIdx((i) => (i + 1) % EXAMPLES.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = request.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    reset();

    try {
      const sessionId = await createSession(trimmed);
      setSessionId(sessionId);
      navigate(`/session/${sessionId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при создании сессии",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
        aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
      >
        {theme === "light" ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-2xl text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <img src="/logo.jpg" alt="Sborka" className="h-12 w-12" />
          <h1 className="text-5xl font-bold tracking-tight text-text-primary">
            Sborka
          </h1>
        </div>
        <p className="mb-10 text-lg text-text-muted">
          Генератор образования
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={4}
              className="relative z-10 w-full resize-none rounded-xl border border-border-strong bg-transparent px-5 py-4 text-base text-text-heading shadow-sm outline-none transition-all focus:border-text-heading focus:bg-surface focus:ring-2 focus:ring-border"
              disabled={isSubmitting}
              aria-label="Опишите, что хотите изучить"
            />
            {!request && (
              <span
                className={`pointer-events-none absolute left-5 top-4 text-base text-text-placeholder transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
              >
                {EXAMPLES[exampleIdx]}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!request.trim() || isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-btn-primary px-8 py-3.5 text-base font-semibold text-btn-primary-text shadow-md transition-all hover:bg-btn-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin-ease"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Создаём программу...
              </span>
            ) : (
              "Собрать программу"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-border-strong bg-surface-alt px-4 py-3 text-sm text-text-body">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-text-placeholder">
          Не вводите персональные данные · Изображение:{" "}
          <a
            href="https://marathonstudio.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text-secondary"
          >
            Marathon Studio
          </a>
        </p>
      </div>
    </div>
  );
}
