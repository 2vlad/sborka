import { useSession } from "../hooks/useSession";

const scaleLabels: Record<string, string> = {
  lesson: "Урок",
  topic: "Тема",
  module: "Модуль",
  profession: "Профессия",
};

export function StatusBar() {
  const { status, classification, errors } = useSession();

  return (
    <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3">
      <a href="/" className="flex items-center gap-2 text-lg font-bold text-black">
        <img src="/logo.svg" alt="" className="h-6 w-6" />
        Sborka
      </a>

      <div className="h-4 w-px bg-gray-300" />

      <div className="flex items-center gap-2 text-sm">
        {status === "idle" && (
          <span className="text-gray-400">Ожидание...</span>
        )}

        {status === "classifying" && (
          <span className="inline-flex items-center gap-2 text-gray-600">
            <Spinner />
            Анализируем запрос...
          </span>
        )}

        {status === "scaffolding" && (
          <span className="inline-flex items-center gap-2 text-gray-600">
            <Spinner />
            Строим структуру...
          </span>
        )}

        {status === "generating" && (
          <span className="inline-flex items-center gap-2 text-gray-600">
            <Spinner />
            Генерируем урок...
          </span>
        )}

        {status === "done" && (
          <span className="inline-flex items-center gap-2 text-black">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Готово
          </span>
        )}

        {status === "error" && (
          <span className="inline-flex items-center gap-2 text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ошибка
          </span>
        )}
      </div>

      {classification && (
        <>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {scaleLabels[classification.scale] ?? classification.scale}
            </span>
            <span className="max-w-xs truncate font-medium text-gray-900">
              {classification.title}
            </span>
            <span className="text-gray-400">{classification.time_estimate}</span>
          </div>
        </>
      )}

      {errors.length > 0 && (
        <>
          <div className="ml-auto" />
          <span className="rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {errors.length} {errors.length === 1 ? "ошибка" : "ошибок"}
          </span>
        </>
      )}
    </header>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
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
  );
}
