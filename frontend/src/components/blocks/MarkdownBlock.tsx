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
    <div className="prose prose-gray max-w-none text-justify prose-headings:text-left prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-gray-900 prose-a:underline prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
      <ReactMarkdown>{markdown}</ReactMarkdown>
      {isGenerating && (
        <span className="inline-block h-4 w-0.5 animate-pulse bg-black" />
      )}
    </div>
  );
}
