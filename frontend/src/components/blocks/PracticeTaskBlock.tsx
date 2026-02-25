import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import type { Block, PracticeTaskPayload, CodeTest } from "../../types/blocks";
import { useSessionStore } from "../../store/sessionStore";

interface PracticeTaskBlockProps {
  block: Block;
}

interface TestResult {
  label: string;
  passed: boolean;
  error?: string;
}

function runTests(code: string, tests: CodeTest[]): TestResult[] {
  return tests.map((test) => {
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function(code + "\nreturn " + test.expression)();
      return { label: test.label, passed: Boolean(result) };
    } catch (err) {
      return {
        label: test.label,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

export function PracticeTaskBlock({ block }: PracticeTaskBlockProps) {
  const payload = block.payload as unknown as PracticeTaskPayload;
  const [showCriteria, setShowCriteria] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState<Set<number>>(
    new Set(),
  );

  const hasCode = Boolean(payload.code_snippet && payload.tests?.length);
  const [code, setCode] = useState(payload.code_snippet ?? "");
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const recordAnswer = useSessionStore((s) => s.recordAnswer);

  const handleRun = useCallback(() => {
    if (payload.tests) {
      const results = runTests(code, payload.tests);
      setTestResults(results);
      recordAnswer(results.every((r) => r.passed));
    }
  }, [code, payload.tests, recordAnswer]);

  if (!payload.description) return null;

  const toggleCriterion = (index: number) => {
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-border-strong bg-surface-alt/50 p-6">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span className="text-sm font-semibold uppercase tracking-wider text-text-body">
          Практическое задание
        </span>
      </div>

      <div className="prose prose-sm max-w-none prose-p:text-text-body">
        <ReactMarkdown>{payload.description}</ReactMarkdown>
      </div>

      {hasCode && (
        <div className="mt-4 space-y-3">
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setTestResults(null);
            }}
            rows={Math.max(6, code.split("\n").length + 2)}
            spellCheck={false}
            className="w-full rounded-lg border border-border-strong bg-surface p-4 font-mono text-sm leading-relaxed text-text-heading focus:border-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary"
          />

          <button
            onClick={handleRun}
            className="inline-flex items-center gap-2 rounded-lg bg-btn-primary px-4 py-2 text-sm font-medium text-btn-primary-text hover:bg-btn-primary-hover"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Проверить
          </button>

          {testResults && (
            <ul className="space-y-1.5">
              {testResults.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={r.passed ? "text-green-600" : "text-red-600"}>
                    {r.passed ? "\u2713" : "\u2717"}
                  </span>
                  <span className={r.passed ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}>
                    {r.label}
                    {r.error && (
                      <span className="ml-2 text-xs text-red-500">({r.error})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {payload.criteria && payload.criteria.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowCriteria(!showCriteria)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-body hover:text-text-primary"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showCriteria ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Показать критерии самопроверки
          </button>

          {showCriteria && (
            <ul className="mt-3 space-y-2">
              {payload.criteria.map((criterion, i) => (
                <li key={i}>
                  <label className="flex items-start gap-3 text-sm text-text-body">
                    <input
                      type="checkbox"
                      checked={checkedCriteria.has(i)}
                      onChange={() => toggleCriterion(i)}
                      className="mt-0.5 h-4 w-4 rounded accent-btn-primary"
                    />
                    <span>{criterion}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
