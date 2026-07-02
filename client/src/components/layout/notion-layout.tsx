import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Sidebar from "./sidebar";

interface NotionLayoutProps {
  children: ReactNode;
}

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 420;
const DEFAULT_SIDEBAR_WIDTH = 240;

export default function NotionLayout({ children }: NotionLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ x: number; width: number } | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragStartRef.current = { x: event.clientX, width: sidebarWidth };
      setIsResizing(true);
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const nextWidth = start.width + (event.clientX - start.x);
      const clamped = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, nextWidth));
      setSidebarWidth(clamped);
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className="relative h-full shrink-0"
        style={{ width: sidebarWidth }}
      >
        <Sidebar />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onPointerDown={handlePointerDown}
          className={`group absolute right-0 top-0 z-40 h-full w-1 cursor-col-resize transition-colors hover:bg-sidebar-border ${
            isResizing ? "bg-sidebar-border" : ""
          }`}
        >
          <span className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-sidebar-border opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
