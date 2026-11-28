"use client";

import React from "react";

type BestDateHighlight = {
  optionId: string | null;
  setOptionId: (optionId: string | null) => void;
};

const BestDateHighlightContext = React.createContext<BestDateHighlight>({
  optionId: null,
  setOptionId: () => {},
});

/**
 * The date the best date card shows, so the results can ring it. Page local:
 * nothing is saved.
 */
export function BestDateHighlightProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [optionId, setOptionId] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ optionId, setOptionId }), [optionId]);
  return (
    <BestDateHighlightContext.Provider value={value}>
      {children}
    </BestDateHighlightContext.Provider>
  );
}

export function useBestDateHighlight() {
  return React.useContext(BestDateHighlightContext);
}
