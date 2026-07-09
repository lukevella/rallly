import { isSelfHosted } from "@/lib/constants";

export const isQuickCreateEnabled =
  !isSelfHosted && process.env.QUICK_CREATE_ENABLED === "true";
