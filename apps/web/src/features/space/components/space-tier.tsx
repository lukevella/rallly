"use client";

import { HandHeartIcon, SparklesIcon } from "lucide-react";
import { PLAN_NAMES } from "@/features/billing/constants";
import type { SpaceTier } from "@/features/space/schema";

export const SpaceTierLabel = ({ tier }: { tier: SpaceTier }) => {
  switch (tier) {
    case "hobby":
      return PLAN_NAMES.HOBBY;
    case "pro":
      return PLAN_NAMES.PRO;
  }
};

export const SpaceTierIcon = ({ tier }: { tier: SpaceTier }) => {
  switch (tier) {
    case "hobby":
      return (
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs">
          <HandHeartIcon className="size-5 text-gray-500" />
        </div>
      );
    case "pro":
      return (
        <div className="inline-flex size-10 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-xs">
          <SparklesIcon className="size-5 text-indigo-500" />
        </div>
      );
  }
};
