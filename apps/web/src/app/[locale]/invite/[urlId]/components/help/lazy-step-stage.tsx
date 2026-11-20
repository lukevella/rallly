"use client";

import dynamic from "next/dynamic";

/**
 * The step demos, loaded when the help sheet first shows them, so their code
 * and motion stay off the vote page until then. The placeholder is the empty
 * stage at its height.
 */
export const LazyStepStage = dynamic(
  () => import("./step-stage").then((mod) => mod.StepStage),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl bg-gray-200/60 dark:bg-gray-900/60" />
    ),
  },
);
