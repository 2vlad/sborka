import type { Block, DialogPayload } from "../../types/blocks";

interface DialogBlockProps {
  block: Block;
}

export function DialogBlock({ block }: DialogBlockProps) {
  const payload = block.payload as unknown as DialogPayload;
  const messages = payload.messages ?? [];

  if (messages.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-alt/50 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-placeholder">
        Диалог
      </div>
      <div className="space-y-3">
        {messages.map((msg, i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              className={`flex ${isEven ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isEven
                    ? "rounded-bl-md bg-surface shadow-sm"
                    : "rounded-br-md bg-dialog-reply text-dialog-reply-text"
                }`}
              >
                <div
                  className={`mb-0.5 text-xs font-medium ${
                    isEven ? "text-text-placeholder" : "text-text-placeholder"
                  }`}
                >
                  {msg.role}
                </div>
                <p
                  className={`text-sm ${
                    isEven ? "text-text-body" : "text-dialog-reply-text"
                  }`}
                >
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
