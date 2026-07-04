"use client";

import { usePoll } from "@/contexts/poll";
import { BrandStyle } from "@/features/branding/brand-style";

export function PollBrandingFromContext() {
  const poll = usePoll();
  if (!poll.space?.showBranding || !poll.space.primaryColor) {
    return null;
  }
  return <BrandStyle primaryColor={poll.space.primaryColor} />;
}
