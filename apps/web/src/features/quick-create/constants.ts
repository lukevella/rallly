import { isSelfHosted } from "@/lib/constants";

// Guest poll creation is a cloud growth surface, gated by its own switch
export const isQuickCreateEnabled =
  !isSelfHosted && process.env.QUICK_CREATE_ENABLED === "true";
