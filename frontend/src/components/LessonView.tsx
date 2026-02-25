import { useMemo } from "react";
import { useSession } from "../hooks/useSession";
import type { PlanNode } from "../types/session";
import { BlockRenderer } from "./blocks/BlockRenderer";

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
  const { outline, currentLessonId, currentBlocks } = useSession();

  const lessonNode = useMemo(() => {
    if (!outline || !currentLessonId) return null;
    return findLessonNode(outline, currentLessonId);
  }, [outline, currentLessonId]);

  if (!currentLessonId) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg">Выберите урок в панели навигации</p>
      </div>
    );
  }

  if (currentBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800" />
        <p className="text-gray-500">Загружаем содержимое урока...</p>
      </div>
    );
  }

  return (
    <article>
      {lessonNode && (
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
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
