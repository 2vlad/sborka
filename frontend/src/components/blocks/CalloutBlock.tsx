import ReactMarkdown from "react-markdown";
import type { Block, CalloutPayload } from "../../types/blocks";

interface CalloutBlockProps {
  block: Block;
}

const styleConfig = {
  info: {
    border: "border-l-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-800",
    icon: (
      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Информация",
  },
  warning: {
    border: "border-l-gray-600",
    bg: "bg-gray-50",
    text: "text-gray-800",
    icon: (
      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    label: "Внимание",
  },
  tip: {
    border: "border-l-black",
    bg: "bg-gray-50",
    text: "text-gray-900",
    icon: (
      <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    label: "Совет",
  },
};

export function CalloutBlock({ block }: CalloutBlockProps) {
  const payload = block.payload as unknown as CalloutPayload;
  const style = payload.style ?? "info";
  const config = styleConfig[style] ?? styleConfig.info;

  return (
    <div
      className={`rounded-r-lg border-l-4 ${config.border} ${config.bg} p-4`}
      role="note"
      aria-label={config.label}
    >
      <div className="mb-2 flex items-center gap-2">
        {config.icon}
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
          {config.label}
        </span>
      </div>
      <div className={`prose prose-sm max-w-none ${config.text}`}>
        <ReactMarkdown>{payload.markdown ?? ""}</ReactMarkdown>
      </div>
    </div>
  );
}
