"use client";
import { usePlan } from "@/contexts/plan";

import { ProBadge } from "./pro-badge";

export const ProFeatureBadge = ({ className }: { className?: string }) => {
  const plan = usePlan();
  if (plan === "free") {
    return <ProBadge className={className} />;
  }
  return null;
};
