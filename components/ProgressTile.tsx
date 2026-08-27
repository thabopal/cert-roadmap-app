"use client";

import { useProgress } from "./ProgressStore";

export function ProgressTile() {
  const { doneMap, allIds } = useProgress();
  const total = allIds.length;
  const done = allIds.filter((id) => doneMap[id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="progress-tile">
      <div className="stat">{pct}%</div>
      <div style={{ flex: 1 }}>
        <div className="ptrack">
          <div className="pfill" style={{ width: `${pct}%` }} />
        </div>
        <div className="stat-label">
          {done} of {total} concepts checked off
        </div>
      </div>
    </div>
  );
}
