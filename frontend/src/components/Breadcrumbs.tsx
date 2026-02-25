import { useMemo } from "react";
import { useSession } from "../hooks/useSession";
import type { PlanNode } from "../types/session";

function findPathToLesson(
  nodes: PlanNode[],
  lessonId: string,
  path: PlanNode[] = [],
): PlanNode[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.type === "lesson" && node.lesson_id === lessonId) {
      return currentPath;
    }
    if (node.children.length > 0) {
      const result = findPathToLesson(node.children, lessonId, currentPath);
      if (result) return result;
    }
  }
  return null;
}

export function Breadcrumbs() {
  const { outline, currentLessonId } = useSession();

  const breadcrumbs = useMemo(() => {
    if (!outline || !currentLessonId) return null;
    return findPathToLesson(outline, currentLessonId);
  }, [outline, currentLessonId]);

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Путь к уроку" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        {breadcrumbs.map((node, i) => (
          <li key={node.id} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                className="h-3 w-3 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "font-medium text-gray-900"
                  : "text-gray-500"
              }
            >
              {node.title}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
