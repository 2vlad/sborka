import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <img src="/logo.jpg" alt="Sborka" className="h-12 w-12" />
          <h1 className="text-5xl font-bold tracking-tight text-black">
            Sborka
          </h1>
        </div>
        <p className="mb-10 text-lg text-gray-500">
          Генератор образования
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={4}
              className="relative z-10 w-full resize-none rounded-xl border border-gray-300 bg-transparent px-5 py-4 text-base text-gray-900 shadow-sm outline-none transition-all focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-200"
              disabled={isSubmitting}
              aria-label="Опишите, что хотите изучить"
            />
            {!request && (
              <span
                className={`pointer-events-none absolute left-5 top-4 text-base text-gray-400 transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
              >
                {EXAMPLES[exampleIdx]}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!request.trim() || isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-black px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
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
          <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">
          Не вводите персональные данные · Изображение:{" "}
          <a
            href="https://marathonstudio.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Marathon Studio
          </a>
        </p>
      </div>
    </div>
  );
}
