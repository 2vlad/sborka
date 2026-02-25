import type { Block } from "./blocks";
import type { PlanNode } from "./session";

export interface SessionCreatedEvent {
  type: "session_created";
  session_id: string;
}

export interface ClassificationReadyEvent {
  type: "classification_ready";
  session_id: string;
  scale: "lesson" | "topic" | "module" | "profession";
  title: string;
  time_estimate: string;
}

export interface OutlineReadyEvent {
  type: "outline_ready";
  session_id: string;
  outline: PlanNode[];
}

export interface LessonScaffoldReadyEvent {
  type: "lesson_scaffold_ready";
  session_id: string;
  lesson_id: string;
  blocks: Block[];
}

export interface BlockStartedEvent {
  type: "block_started";
  session_id: string;
  lesson_id: string;
  block_id: string;
}

export interface BlockDeltaEvent {
  type: "block_delta";
  session_id: string;
  lesson_id: string;
  block_id: string;
  delta: string;
}

export interface BlockReadyEvent {
  type: "block_ready";
  session_id: string;
  lesson_id: string;
  block_id: string;
  payload: Record<string, unknown>;
}

export interface AssetReservedEvent {
  type: "asset_reserved";
  session_id: string;
  lesson_id: string;
  block_id: string;
  asset_id: string;
  aspect_ratio: string;
  caption: string;
}

export interface AssetReadyEvent {
  type: "asset_ready";
  session_id: string;
  asset_id: string;
  url: string;
}

export interface ErrorEvent {
  type: "error";
  session_id: string;
  scope: "session" | "lesson" | "block" | "asset";
  message: string;
  block_id?: string;
}

export interface DoneEvent {
  type: "done";
  session_id: string;
}

export interface PlanNodeStatusEvent {
  type: "plan_node_status";
  session_id: string;
  node_id: string;
  status: string;
}

export type SSEEvent =
  | SessionCreatedEvent
  | ClassificationReadyEvent
  | OutlineReadyEvent
  | LessonScaffoldReadyEvent
  | BlockStartedEvent
  | BlockDeltaEvent
  | BlockReadyEvent
  | AssetReservedEvent
  | AssetReadyEvent
  | ErrorEvent
  | DoneEvent
  | PlanNodeStatusEvent;
