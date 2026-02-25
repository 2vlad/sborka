import { create } from "zustand";
import type { Block } from "../types/blocks";
import type { SSEEvent } from "../types/events";
import type {
  Classification,
  PlanNode,
  SessionStatus,
} from "../types/session";

interface SessionStore {
  // State
  sessionId: string | null;
  status: SessionStatus;
  classification: Classification | null;
  outline: PlanNode[] | null;
  currentLessonId: string | null;
  lessons: Record<string, Block[]>;
  errors: string[];
  /** Maps asset_id to { lessonId, blockId } for resolving asset_ready events */
  assetMap: Record<string, { lessonId: string; blockId: string }>;
  skillLevel: number;

  // Actions
  handleEvent: (event: SSEEvent) => void;
  reset: () => void;
  setCurrentLesson: (lessonId: string) => void;
  setSessionId: (sessionId: string) => void;
  recordAnswer: (correct: boolean) => void;
}

function updateNodeStatus(
  nodes: PlanNode[],
  nodeId: string,
  status: string,
): PlanNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, status: status as PlanNode["status"] };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateNodeStatus(node.children, nodeId, status),
      };
    }
    return node;
  });
}

function updateBlockInLesson(
  blocks: Block[],
  blockId: string,
  updater: (block: Block) => Block,
): Block[] {
  return blocks.map((block) => (block.id === blockId ? updater(block) : block));
}

const initialState = {
  sessionId: null as string | null,
  status: "idle" as SessionStatus,
  classification: null as Classification | null,
  outline: null as PlanNode[] | null,
  currentLessonId: null as string | null,
  lessons: {} as Record<string, Block[]>,
  errors: [] as string[],
  assetMap: {} as Record<string, { lessonId: string; blockId: string }>,
  skillLevel: 50,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  handleEvent: (event: SSEEvent) => {
    switch (event.type) {
      case "session_created":
        set({ status: "classifying" });
        break;

      case "classification_ready":
        set({
          classification: {
            scale: event.scale,
            title: event.title,
            time_estimate: event.time_estimate,
          },
          status: "scaffolding",
        });
        break;

      case "outline_ready":
        set({ outline: event.outline });
        break;

      case "lesson_scaffold_ready":
        set((state) => {
          const newAssetMap = { ...state.assetMap };
          for (const block of event.blocks) {
            if (
              block.type === "image" &&
              block.payload &&
              typeof block.payload === "object"
            ) {
              // Image blocks have an implicit asset_id matching block.id
              // The asset_reserved event will provide the actual mapping
            }
          }
          return {
            lessons: {
              ...state.lessons,
              [event.lesson_id]: event.blocks,
            },
            currentLessonId: state.currentLessonId ?? event.lesson_id,
            status: "generating",
            assetMap: newAssetMap,
          };
        });
        break;

      case "block_started":
        set((state) => {
          const blocks = state.lessons[event.lesson_id];
          if (!blocks) return state;
          return {
            lessons: {
              ...state.lessons,
              [event.lesson_id]: updateBlockInLesson(
                blocks,
                event.block_id,
                (block) => ({ ...block, status: "generating" }),
              ),
            },
          };
        });
        break;

      case "block_delta":
        set((state) => {
          const blocks = state.lessons[event.lesson_id];
          if (!blocks) return state;
          return {
            lessons: {
              ...state.lessons,
              [event.lesson_id]: updateBlockInLesson(
                blocks,
                event.block_id,
                (block) => {
                  const currentMarkdown =
                    (block.payload as Record<string, unknown>).markdown ?? "";
                  return {
                    ...block,
                    status: "generating",
                    payload: {
                      ...block.payload,
                      markdown: String(currentMarkdown) + event.delta,
                    },
                  };
                },
              ),
            },
          };
        });
        break;

      case "block_ready":
        set((state) => {
          const blocks = state.lessons[event.lesson_id];
          if (!blocks) return state;
          return {
            lessons: {
              ...state.lessons,
              [event.lesson_id]: updateBlockInLesson(
                blocks,
                event.block_id,
                (block) => {
                  const existingUrl = (block.payload as Record<string, unknown>)?.url;
                  const newPayload = existingUrl
                    ? { ...event.payload, url: existingUrl }
                    : event.payload;
                  return {
                    ...block,
                    status: "ready",
                    payload: newPayload,
                  };
                },
              ),
            },
          };
        });
        break;

      case "asset_reserved":
        set((state) => ({
          assetMap: {
            ...state.assetMap,
            [event.asset_id]: {
              lessonId: event.lesson_id,
              blockId: event.block_id,
            },
          },
        }));
        break;

      case "asset_ready":
        set((state) => {
          const mapping = state.assetMap[event.asset_id];
          if (!mapping) return state;
          const blocks = state.lessons[mapping.lessonId];
          if (!blocks) return state;
          return {
            lessons: {
              ...state.lessons,
              [mapping.lessonId]: updateBlockInLesson(
                blocks,
                mapping.blockId,
                (block) => ({
                  ...block,
                  payload: { ...block.payload, url: event.url },
                }),
              ),
            },
          };
        });
        break;

      case "plan_node_status":
        set((state) => {
          if (!state.outline) return state;
          return {
            outline: updateNodeStatus(
              state.outline,
              event.node_id,
              event.status,
            ),
          };
        });
        break;

      case "error":
        set((state) => ({
          errors: [...state.errors, event.message],
          status:
            event.scope === "session"
              ? ("error" as const)
              : state.status,
        }));
        break;

      case "done":
        set({ status: "done" });
        break;
    }
  },

  reset: () => set(initialState),

  setCurrentLesson: (lessonId: string) => set({ currentLessonId: lessonId }),

  setSessionId: (sessionId: string) => set({ sessionId }),

  recordAnswer: (correct: boolean) =>
    set((state) => ({
      skillLevel: Math.max(0, Math.min(100, state.skillLevel + (correct ? 10 : -10))),
    })),
}));
