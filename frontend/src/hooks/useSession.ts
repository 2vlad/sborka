import { useSessionStore } from "../store/sessionStore";

export function useSession() {
  const sessionId = useSessionStore((s) => s.sessionId);
  const status = useSessionStore((s) => s.status);
  const classification = useSessionStore((s) => s.classification);
  const outline = useSessionStore((s) => s.outline);
  const currentLessonId = useSessionStore((s) => s.currentLessonId);
  const lessons = useSessionStore((s) => s.lessons);
  const errors = useSessionStore((s) => s.errors);
  const setCurrentLesson = useSessionStore((s) => s.setCurrentLesson);
  const reset = useSessionStore((s) => s.reset);

  const currentBlocks = currentLessonId ? (lessons[currentLessonId] ?? []) : [];

  return {
    sessionId,
    status,
    classification,
    outline,
    currentLessonId,
    lessons,
    errors,
    currentBlocks,
    setCurrentLesson,
    reset,
  };
}
