import type { EmailConferencing } from "@rallly/emails";

import type { Conferencing } from "@/features/conferencing/schema";
import { getConferencingUri } from "@/features/conferencing/utils";

export function toEmailConferencing(
  conferencing: Conferencing,
): EmailConferencing {
  return {
    provider: conferencing.provider,
    label: conferencing.provider === "custom" ? conferencing.label : undefined,
    url: getConferencingUri(conferencing),
  };
}
