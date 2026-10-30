"use client";

import * as React from "react";

/**
 * Provides a client clock that refreshes periodically without reading the
 * current time during server rendering.
 */
export function useCurrentTime() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const update = () => setNow(new Date());
    update();

    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
