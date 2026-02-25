import ReactMarkdown from "react-markdown";
import type { Block, MarkdownPayload } from "../../types/blocks";

interface MarkdownBlockProps {
  block: Block;
}

export function MarkdownBlock({ block }: MarkdownBlockProps) {
  const payload = block.payload as unknown as MarkdownPayload;
  const markdown = payload.markdown ?? "";
  const isGenerating = block.status === "generating";

  return (
    <div className="prose prose-gray max-w-none text-justify prose-headings:text-left prose-headings:text-text-heading prose-p:text-text-body prose-a:text-text-heading prose-a:underline prose-code:rounded prose-code:bg-surface-raised prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-code-bg prose-pre:text-code-text">
      <ReactMarkdown>{markdown}</ReactMarkdown>
      {isGenerating && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-text-primary" />
      )}
    </div>
  );
}
