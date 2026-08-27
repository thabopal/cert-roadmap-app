"use client";

import type { ChecklistItem } from "@/lib/types";
import { useProgress } from "./ProgressStore";

export function Checklist({ items }: { items: ChecklistItem[] }) {
  const { doneMap, toggle } = useProgress();
  return (
    <ul className="checklist">
      {items.map((item) => {
        const done = !!doneMap[item.id];
        return (
          <li
            key={item.id}
            data-id={item.id}
            className={done ? "done" : ""}
            onClick={() => toggle(item.id)}
            role="checkbox"
            aria-checked={done}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(item.id);
              }
            }}
          >
            <span className="box">{done ? "✓" : ""}</span>
            <span dangerouslySetInnerHTML={{ __html: item.text }} />
          </li>
        );
      })}
    </ul>
  );
}
