"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ProgressContextValue {
  doneMap: Record<string, boolean>;
  allIds: string[];
  toggle: (id: string) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  allIds,
  initialProgress,
  children,
}: {
  allIds: string[];
  initialProgress: Record<string, boolean>;
  children: React.ReactNode;
}) {
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>(initialProgress);

  // Fire-and-forget sync to the server; UI updates optimistically. If the
  // request fails (offline, DB hiccup), the click still "sticks" locally for
  // this tab — next load reconciles against whatever the server actually has.
  const persist = useCallback((itemId: string, done: boolean) => {
    fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, done }),
    }).catch(() => {
      /* best-effort — see comment above */
    });
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setDoneMap((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        persist(id, next[id]);
        return next;
      });
    },
    [persist]
  );

  const resetAll = useCallback(() => {
    setDoneMap({});
    for (const id of allIds) persist(id, false);
  }, [allIds, persist]);

  const value = useMemo(() => ({ doneMap, allIds, toggle, resetAll }), [doneMap, allIds, toggle, resetAll]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}
