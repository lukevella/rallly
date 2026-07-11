"use client";

import { BrandStyle } from "@/features/branding/components/brand-style";
import { usePoll } from "@/features/poll/client";

export function PollBrandingFromContext() {
  const poll = usePoll();
  if (!poll.space?.showBranding || !poll.space.primaryColor) {
    return null;
  }
  return <BrandStyle primaryColor={poll.space.primaryColor} />;
}
