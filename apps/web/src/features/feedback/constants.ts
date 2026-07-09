import { isSelfHosted } from "@/lib/constants";

export const isFeedbackEnabled = !isSelfHosted;
