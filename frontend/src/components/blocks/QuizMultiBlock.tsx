import { useState } from "react";
import type { Block, QuizMultiPayload } from "../../types/blocks";
import { useSessionStore } from "../../store/sessionStore";

interface QuizMultiBlockProps {
  block: Block;
}

export function QuizMultiBlock({ block }: QuizMultiBlockProps) {
  const payload = block.payload as unknown as QuizMultiPayload;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const recordAnswer = useSessionStore((s) => s.recordAnswer);

  if (!payload.question) return null;

  const correctSet = new Set(payload.correct_option_ids ?? []);
  const isFullyCorrect =
    checked &&
    selectedIds.size === correctSet.size &&
    [...selectedIds].every((id) => correctSet.has(id));

  const toggleOption = (id: string) => {
    if (checked) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="mb-1 text-base font-semibold text-text-heading">
        {payload.question}
      </p>
      <p className="mb-4 text-xs text-text-placeholder">
        Выберите все подходящие варианты
      </p>

      <div className="space-y-2" role="group" aria-label={payload.question}>
        {payload.options?.map((option) => {
          const isSelected = selectedIds.has(option.id);
          const isOptionCorrect = checked && correctSet.has(option.id);
          const isOptionWrong =
            checked && isSelected && !correctSet.has(option.id);
          const isMissed =
            checked && !isSelected && correctSet.has(option.id);

          let borderClass = "border-border";
          let bgClass = "bg-surface";
          if (checked) {
            if (isOptionCorrect && isSelected) {
              borderClass = "border-green-300";
              bgClass = "bg-green-50 dark:bg-green-950/30";
            } else if (isOptionWrong) {
              borderClass = "border-red-300";
              bgClass = "bg-red-50 dark:bg-red-950/30";
            } else if (isMissed) {
              borderClass = "border-green-300 border-dashed";
              bgClass = "bg-green-50 dark:bg-green-950/30";
            }
          } else if (isSelected) {
            borderClass = "border-text-heading";
            bgClass = "bg-surface-alt";
          }

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${borderClass} ${bgClass} ${
                checked ? "cursor-default" : "hover:bg-surface-alt"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOption(option.id)}
                disabled={checked}
                className="h-4 w-4 rounded accent-btn-primary"
                aria-label={option.text}
              />
              <span className="text-sm text-text-body">{option.text}</span>
              {checked && isOptionCorrect && isSelected && (
                <svg className="ml-auto h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {checked && isOptionWrong && (
                <svg className="ml-auto h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {checked && isMissed && (
                <span className="ml-auto text-xs text-text-muted">пропущено</span>
              )}
            </label>
          );
        })}
      </div>

      {!checked && (
        <button
          onClick={() => {
            setChecked(true);
            const correctSet = new Set(payload.correct_option_ids ?? []);
            const allCorrect =
              selectedIds.size === correctSet.size &&
              [...selectedIds].every((id) => correctSet.has(id));
            recordAnswer(allCorrect);
          }}
          disabled={selectedIds.size === 0}
          className="mt-4 rounded-lg bg-btn-primary px-5 py-2 text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Проверить
        </button>
      )}

      {checked && (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            isFullyCorrect
              ? "border-green-300 bg-green-50 text-text-heading dark:bg-green-950/30"
              : "border-red-300 bg-red-50 text-text-body dark:bg-red-950/30"
          }`}
        >
          <p className="mb-1 font-semibold">
            {isFullyCorrect ? "Верно!" : "Не все ответы правильные"}
          </p>
          {payload.explanation && <p>{payload.explanation}</p>}
        </div>
      )}
    </div>
  );
}
