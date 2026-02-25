import { useState } from "react";
import { useSession } from "../hooks/useSession";
import type { PlanNode } from "../types/session";

const nodeIcons: Record<string, string> = {
  profession: "\uD83C\uDF93",
  module: "\uD83D\uDCE6",
  topic: "\uD83D\uDCCB",
  lesson: "\uD83D\uDCC4",
};

const statusDotStyles: Record<string, { color: string; pulse: boolean }> = {
  planned: { color: "#D1D5DB", pulse: false },
  generating: { color: "#FCB404", pulse: true },
  ready: { color: "#3C9245", pulse: false },
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { outline, currentLessonId, setCurrentLesson } = useSession();

  if (!outline || outline.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">Структура загружается...</div>
    );
  }

  return (
    <nav className="p-4" aria-label="Навигация по программе">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Структура программы
      </h2>
      <ul className="space-y-0.5">
        {outline.map((node) => (
          <SidebarNode
            key={node.id}
            node={node}
            level={0}
            currentLessonId={currentLessonId}
            onSelect={(lessonId) => {
              setCurrentLesson(lessonId);
              onNavigate?.();
            }}
          />
        ))}
      </ul>
    </nav>
  );
}

interface SidebarNodeProps {
  node: PlanNode;
  level: number;
  currentLessonId: string | null;
  onSelect: (lessonId: string) => void;
}

function SidebarNode({ node, level, currentLessonId, onSelect }: SidebarNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isLesson = node.type === "lesson";
  const isActive = isLesson && node.lesson_id === currentLessonId;

  const handleClick = () => {
    if (isLesson && node.lesson_id) {
      onSelect(node.lesson_id);
    } else if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
          isActive
            ? "bg-gray-200 font-medium text-black"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        aria-current={isActive ? "page" : undefined}
      >
        {hasChildren && (
          <svg
            className={`h-3 w-3 flex-shrink-0 text-gray-400 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        {!hasChildren && <span className="w-3 flex-shrink-0" />}

        <span className="flex-shrink-0" aria-hidden="true">
          {nodeIcons[node.type] ?? ""}
        </span>

        <span className="min-w-0 flex-1 truncate">{node.title}</span>

        <span
          className={`h-2 w-2 flex-shrink-0 rounded-full ${(statusDotStyles[node.status] ?? statusDotStyles.planned).pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: (statusDotStyles[node.status] ?? statusDotStyles.planned).color }}
          aria-label={`Статус: ${node.status}`}
        />
      </button>

      {hasChildren && expanded && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <SidebarNode
              key={child.id}
              node={child}
              level={level + 1}
              currentLessonId={currentLessonId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
