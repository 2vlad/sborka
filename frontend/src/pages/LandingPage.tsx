import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../api/client";
import { useSessionStore } from "../store/sessionStore";

export default function LandingPage() {
  const [request, setRequest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reset = useSessionStore((s) => s.reset);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const navigate = useNavigate();

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
          <img src="/logo.svg" alt="" className="h-12 w-12" />
          <h1 className="text-5xl font-bold tracking-tight text-black">
            Sborka
          </h1>
        </div>
        <p className="mb-10 text-lg text-gray-500">
          Генеративная образовательная платформа
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Например: хочу разобраться в модулях JavaScript"
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-5 py-4 text-base text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-200"
            disabled={isSubmitting}
            aria-label="Опишите, что хотите изучить"
          />

          <button
            type="submit"
            disabled={!request.trim() || isSubmitting}
            className="w-full cursor-pointer rounded-xl bg-black px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
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
          Не вводите персональные данные
        </p>
      </div>
    </div>
  );
}
