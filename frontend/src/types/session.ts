import type { Block } from "./blocks";

export interface PlanNode {
  id: string;
  type: "profession" | "module" | "topic" | "lesson";
  title: string;
  status: "planned" | "generating" | "ready";
  children: PlanNode[];
  lesson_id?: string;
}

export interface Classification {
  scale: "lesson" | "topic" | "module" | "profession";
  title: string;
  time_estimate: string;
}

export type SessionStatus =
  | "idle"
  | "classifying"
  | "scaffolding"
  | "generating"
  | "done"
  | "error";

export interface SessionState {
  sessionId: string | null;
  status: SessionStatus;
  classification: Classification | null;
  outline: PlanNode[] | null;
  currentLessonId: string | null;
  lessons: Record<string, Block[]>;
  errors: string[];
}

export interface SessionSnapshot {
  session_id: string;
  status: string;
  classification: Classification | null;
  outline: PlanNode[] | null;
  lessons: Record<
    string,
    { title: string; status: string; blocks: Block[] }
  >;
}
