export type BlockType =
  | "heading"
  | "markdown"
  | "quiz_single"
  | "quiz_multi"
  | "practice_task"
  | "callout"
  | "dialog"
  | "image";

export type BlockStatus = "planned" | "generating" | "ready" | "error";

export interface QuizOption {
  id: string;
  text: string;
}

export interface HeadingPayload {
  level: 2 | 3;
  text: string;
}

export interface MarkdownPayload {
  markdown: string;
}

export interface QuizSinglePayload {
  question: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation: string;
}

export interface QuizMultiPayload {
  question: string;
  options: QuizOption[];
  correct_option_ids: string[];
  explanation: string;
}

export interface CodeTest {
  label: string;
  expression: string;
}

export interface PracticeTaskPayload {
  description: string;
  criteria: string[];
  code_snippet?: string;
  tests?: CodeTest[];
}

export interface CalloutPayload {
  style: "info" | "warning" | "tip";
  markdown: string;
}

export interface DialogMessage {
  role: string;
  text: string;
}

export interface DialogPayload {
  messages: DialogMessage[];
}

export interface ImagePayload {
  alt: string;
  caption: string;
  aspect_ratio: string;
  image_prompt: string;
  url: string | null;
}

export interface Block {
  id: string;
  type: BlockType;
  status: BlockStatus;
  payload: Record<string, unknown>;
}
