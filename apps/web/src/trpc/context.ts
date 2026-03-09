import type { WideEvent } from "@rallly/logger";
import type { UserDTO } from "@/features/user/schema";

export type TRPCContext = {
  user?: UserDTO;
  locale?: string;
  identifier?: string;
  event?: WideEvent;
};
