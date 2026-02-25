import type { Block } from "../../types/blocks";
import type { HeadingPayload } from "../../types/blocks";

interface HeadingBlockProps {
  block: Block;
}

export function HeadingBlock({ block }: HeadingBlockProps) {
  const payload = block.payload as unknown as HeadingPayload;
  const level = payload.level ?? 2;
  const text = payload.text ?? "";

  if (level === 3) {
    return (
      <h3 className="text-xl font-semibold text-text-heading">{text}</h3>
    );
  }

  return (
    <h2 className="text-2xl font-bold text-text-heading">{text}</h2>
  );
}
