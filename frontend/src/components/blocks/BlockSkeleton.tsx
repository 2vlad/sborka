import type { BlockType } from "../../types/blocks";

interface BlockSkeletonProps {
  blockType: BlockType;
}

const heightMap: Record<BlockType, string> = {
  heading: "h-8",
  markdown: "h-24",
  quiz_single: "h-40",
  quiz_multi: "h-40",
  practice_task: "h-32",
  callout: "h-20",
  dialog: "h-32",
  image: "h-48",
};

export function BlockSkeleton({ blockType }: BlockSkeletonProps) {
  const height = heightMap[blockType] ?? "h-24";

  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-raised ${height}`}
      role="status"
      aria-label="Загрузка блока"
    >
      <div className="flex h-full flex-col justify-center gap-2 p-6">
        <div className="h-3 w-3/4 rounded bg-surface-inset" />
        <div className="h-3 w-1/2 rounded bg-surface-inset" />
        {blockType !== "heading" && (
          <>
            <div className="h-3 w-5/6 rounded bg-surface-inset" />
            <div className="h-3 w-2/3 rounded bg-surface-inset" />
          </>
        )}
      </div>
    </div>
  );
}
