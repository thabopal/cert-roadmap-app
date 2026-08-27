"use client";

import { useState } from "react";
import { useProgress } from "./ProgressStore";

export function TopControls() {
  const { resetAll } = useProgress();
  // Lazy initializer instead of an effect: reflects whatever's already on
  // <html data-theme> (set by the inline script in app/page.tsx before
  // hydration, to avoid a flash) without an extra render pass. Guarded for
  // the server-rendered pass, where `document` doesn't exist yet.
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  });

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("certRoadmapTheme", next);
    } catch {
      /* storage unavailable — theme just won't persist across reloads */
    }
  }

  function handleReset() {
    if (confirm("Reset all checked-off progress? This clears it everywhere this roadmap is open, not just this device.")) {
      resetAll();
    }
  }

  return (
    <div className="top-controls">
      <button className="ctrl-btn" onClick={toggleTheme}>
        Toggle dark mode
      </button>
      <button className="ctrl-btn" onClick={handleReset}>
        Reset progress
      </button>
    </div>
  );
}
