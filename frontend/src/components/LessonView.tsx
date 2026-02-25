import { useMemo } from "react";
import { useSession } from "../hooks/useSession";
import type { PlanNode } from "../types/session";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { BlockSkeleton } from "./blocks/BlockSkeleton";
import type { BlockType } from "../types/blocks";

function findLessonNode(
  nodes: PlanNode[],
  lessonId: string,
): PlanNode | null {
  for (const node of nodes) {
    if (node.type === "lesson" && node.lesson_id === lessonId) return node;
    if (node.children.length > 0) {
      const found = findLessonNode(node.children, lessonId);
      if (found) return found;
    }
  }
  return null;
}

export function LessonView() {
  const { outline, currentLessonId, currentBlocks, status } = useSession();

  const lessonNode = useMemo(() => {
    if (!outline || !currentLessonId) return null;
    return findLessonNode(outline, currentLessonId);
  }, [outline, currentLessonId]);

  if (!currentLessonId) {
    return (
      <div className="py-20 text-center text-text-placeholder">
        <p className="text-lg">Выберите урок в панели навигации</p>
      </div>
    );
  }

  if (currentBlocks.length === 0) {
    if (status === "done") {
      return (
        <div className="py-20 text-center text-text-placeholder">
          <p className="text-lg">Этот урок ещё не сгенерирован</p>
        </div>
      );
    }
    const placeholderTypes: BlockType[] = [
      "heading", "markdown", "markdown", "image", "markdown",
    ];
    return (
      <article>
        {lessonNode && (
          <h1 className="mb-8 text-3xl font-bold text-text-heading">
            {lessonNode.title}
          </h1>
        )}
        <div className="space-y-6">
          {placeholderTypes.map((type, i) => (
            <BlockSkeleton key={i} blockType={type} />
          ))}
        </div>
      </article>
    );
  }

  return (
    <article>
      {lessonNode && (
        <h1 className="mb-8 text-3xl font-bold text-text-heading">
          {lessonNode.title}
        </h1>
      )}
      <div className="space-y-6">
        {currentBlocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </article>
  );
}
