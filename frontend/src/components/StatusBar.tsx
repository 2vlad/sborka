import { useSession } from "../hooks/useSession";
import { useSessionStore } from "../store/sessionStore";
import { useTheme } from "../hooks/useTheme";

const scaleLabels: Record<string, string> = {
  lesson: "Урок",
  topic: "Тема",
  module: "Модуль",
  profession: "Профессия",
};

export function StatusBar() {
  const { status, classification, errors } = useSession();
  const skillLevel = useSessionStore((s) => s.skillLevel);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
      <a href="/" className="flex items-center gap-2 text-lg font-bold text-text-primary">
        <img src="/logo.jpg" alt="Sborka" className="h-6 w-6" />
        Sborka
      </a>

      <div className="h-4 w-px bg-border-strong" />

      <div className="flex items-center gap-2 text-sm">
        {status === "idle" && (
          <span className="text-text-placeholder">Ожидание...</span>
        )}

        {status === "classifying" && (
          <span className="inline-flex items-center gap-2 text-text-secondary">
            <Spinner />
            Анализируем запрос...
          </span>
        )}

        {status === "scaffolding" && (
          <span className="inline-flex items-center gap-2 text-text-secondary">
            <Spinner />
            Строим структуру...
          </span>
        )}

        {status === "generating" && (
          <GeneratingStatus />
        )}

        {status === "done" && (
          <span className="inline-flex items-center gap-2 text-text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Готово
          </span>
        )}

        {status === "error" && (
          <span className="inline-flex items-center gap-2 text-text-secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ошибка
          </span>
        )}
      </div>

      {classification && (
        <>
          <div className="h-4 w-px bg-border-strong" />
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span className="rounded-full border border-border-strong bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-body">
              {scaleLabels[classification.scale] ?? classification.scale}
            </span>
            <span className="max-w-xs truncate font-medium text-text-heading">
              {classification.title}
            </span>
            <span className="text-text-placeholder">{classification.time_estimate}</span>
          </div>
        </>
      )}

      <SkillThermometer level={skillLevel} />

      <button
        onClick={toggleTheme}
        className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
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

      {errors.length > 0 && (
        <span className="rounded-full border border-border-strong bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-body">
          {errors.length} {errors.length === 1 ? "ошибка" : "ошибок"}
        </span>
      )}
    </header>
  );
}

function SkillThermometer({ level }: { level: number }) {
  const hue = Math.round((level / 100) * 120);
  return (
    <div className="ml-auto flex items-center gap-2" title={`Уровень: ${level}`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-inset">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${level}%`,
            backgroundColor: `hsl(${hue}, 80%, 45%)`,
          }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-text-secondary">
        {level}
      </span>
    </div>
  );
}

function GeneratingStatus() {
  const currentLessonId = useSessionStore((s) => s.currentLessonId);
  const lessons = useSessionStore((s) => s.lessons);
  const currentBlocks = currentLessonId ? (lessons[currentLessonId] ?? []) : [];
  const totalBlocks = currentBlocks.length;
  const readyBlocks = currentBlocks.filter((b) => b.status === "ready").length;

  if (totalBlocks === 0) {
    return (
      <span className="inline-flex items-center gap-2 text-text-secondary">
        <Spinner />
        Генерируем урок...
      </span>
    );
  }

  const pct = Math.round((readyBlocks / totalBlocks) * 100);

  return (
    <span className="inline-flex items-center gap-2 text-text-secondary">
      <Spinner />
      <span>Генерируем блок {readyBlocks + 1} из {totalBlocks}...</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-inset">
        <div
          className="h-full rounded-full bg-text-body transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin-ease" viewBox="0 0 24 24" fill="none">
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
