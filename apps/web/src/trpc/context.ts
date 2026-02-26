import type { WideEvent } from "@rallly/logger";

export type User = {
  id: string;
  isGuest: boolean;
  locale?: string;
  image?: string;
  timeZone?: string;
};

export type TRPCContext = {
  user?: User;
  locale?: string;
  identifier?: string;
  event: WideEvent;
};
