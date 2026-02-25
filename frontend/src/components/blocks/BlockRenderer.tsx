import type { Block } from "../../types/blocks";
import { BlockSkeleton } from "./BlockSkeleton";
import { CalloutBlock } from "./CalloutBlock";
import { DialogBlock } from "./DialogBlock";
import { HeadingBlock } from "./HeadingBlock";
import { ImageBlock } from "./ImageBlock";
import { MarkdownBlock } from "./MarkdownBlock";
import { PracticeTaskBlock } from "./PracticeTaskBlock";
import { QuizMultiBlock } from "./QuizMultiBlock";
import { QuizSingleBlock } from "./QuizSingleBlock";

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  if (block.status === "planned") {
    return <BlockSkeleton blockType={block.type} />;
  }

  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} />;
    case "markdown":
      return <MarkdownBlock block={block} />;
    case "quiz_single":
      return <QuizSingleBlock block={block} />;
    case "quiz_multi":
      return <QuizMultiBlock block={block} />;
    case "practice_task":
      return <PracticeTaskBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "dialog":
      return <DialogBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    default:
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          Неизвестный тип блока: {block.type}
        </div>
      );
  }
}
