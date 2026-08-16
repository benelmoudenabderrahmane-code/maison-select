"use client";

import * as React from "react";

function nextMidnight(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function Countdown({ className }: { className?: string }) {
  const [target] = React.useState(nextMidnight);
  const [remaining, setRemaining] = React.useState(target - Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: [string, number][] = [["Heures", h], ["Min", m], ["Sec", s]];

  return (
    <div className={className} aria-label="Temps restant de l'offre" suppressHydrationWarning>
      <div className="flex items-center gap-2">
        {parts.map(([label, value], i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="text-2xl font-light text-muted-foreground">:</span>}
            <div className="flex flex-col items-center">
              <span suppressHydrationWarning className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface font-serif text-2xl font-semibold tabular-nums shadow-sm sm:h-16 sm:w-16 sm:text-3xl">
                {String(value).padStart(2, "0")}
              </span>
              <span className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
