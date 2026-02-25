import { useState } from "react";
import type { Block, QuizSinglePayload } from "../../types/blocks";
import { useSessionStore } from "../../store/sessionStore";

interface QuizSingleBlockProps {
  block: Block;
}

export function QuizSingleBlock({ block }: QuizSingleBlockProps) {
  const payload = block.payload as unknown as QuizSinglePayload;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const recordAnswer = useSessionStore((s) => s.recordAnswer);

  if (!payload.question) return null;

  const isCorrect = checked && selectedId === payload.correct_option_id;
  const isIncorrect = checked && selectedId !== payload.correct_option_id;

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="mb-4 text-base font-semibold text-text-heading">
        {payload.question}
      </p>

      <div className="space-y-2" role="radiogroup" aria-label={payload.question}>
        {payload.options?.map((option) => {
          const isSelected = selectedId === option.id;
          const isOptionCorrect =
            checked && option.id === payload.correct_option_id;
          const isOptionWrong =
            checked && isSelected && option.id !== payload.correct_option_id;

          let borderClass = "border-border";
          let bgClass = "bg-surface";
          if (checked) {
            if (isOptionCorrect) {
              borderClass = "border-green-300";
              bgClass = "bg-green-50 dark:bg-green-950/30";
            } else if (isOptionWrong) {
              borderClass = "border-red-300";
              bgClass = "bg-red-50 dark:bg-red-950/30";
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
                type="radio"
                name={`quiz-${block.id}`}
                value={option.id}
                checked={isSelected}
                onChange={() => {
                  if (!checked) setSelectedId(option.id);
                }}
                disabled={checked}
                className="h-4 w-4 accent-btn-primary"
                aria-label={option.text}
              />
              <span className="text-sm text-text-body">{option.text}</span>
              {checked && isOptionCorrect && (
                <svg className="ml-auto h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {checked && isOptionWrong && (
                <svg className="ml-auto h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </label>
          );
        })}
      </div>

      {!checked && (
        <button
          onClick={() => {
            setChecked(true);
            recordAnswer(selectedId === payload.correct_option_id);
          }}
          disabled={!selectedId}
          className="mt-4 rounded-lg bg-btn-primary px-5 py-2 text-sm font-medium text-btn-primary-text transition-colors hover:bg-btn-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Проверить
        </button>
      )}

      {checked && (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            isCorrect
              ? "border-green-300 bg-green-50 text-text-heading dark:bg-green-950/30"
              : "border-red-300 bg-red-50 text-text-body dark:bg-red-950/30"
          }`}
        >
          <p className="mb-1 font-semibold">
            {isCorrect ? "Верно!" : "Неверно"}
          </p>
          {payload.explanation && <p>{payload.explanation}</p>}
        </div>
      )}

      {isIncorrect && null}
    </div>
  );
}
