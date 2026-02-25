import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sborka-sidebar-width";
const DEFAULT_WIDTH = 288; // w-72
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

function loadWidth(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = Number(stored);
      if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

export function useResizable() {
  const [width, setWidth] = useState(loadWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startX.current = e.clientX;
      startWidth.current = width;
      setIsResizing(true);
    },
    [width],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    },
    [isResizing],
  );

  const handlePointerUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Persist to localStorage on change (debounced by the fact it only writes on pointerUp cycle)
  useEffect(() => {
    if (!isResizing) {
      try {
        localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        // ignore
      }
    }
  }, [isResizing, width]);

  // Prevent text selection while dragging
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      return () => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [isResizing]);

  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
    } catch {
      // ignore
    }
  }, []);

  return {
    width,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetWidth,
  };
}
