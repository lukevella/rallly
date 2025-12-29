"use client";

import { HandHeartIcon, SparklesIcon } from "lucide-react";
import { PLAN_NAMES } from "@/features/billing/constants";
import type { SpaceTier } from "@/features/space/schema";

export const SpaceTierLabel = ({ tier }: { tier: SpaceTier }) => {
  switch (tier) {
    case "hobby":
      return <span className="text-muted-foreground">{PLAN_NAMES.HOBBY}</span>;
    case "pro":
      return <span className="text-primary">{PLAN_NAMES.PRO}</span>;
  }
};

export const SpaceTierIcon = ({ tier }: { tier: SpaceTier }) => {
  switch (tier) {
    case "hobby":
      return (
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-muted-border bg-muted text-muted-foreground text-xs">
          <HandHeartIcon className="size-5" />
        </div>
      );
    case "pro":
      return (
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-primary-border bg-primary text-xs">
          <SparklesIcon className="size-5 text-primary-foreground" />
        </div>
      );
  }
};
