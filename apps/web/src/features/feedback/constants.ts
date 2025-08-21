import { isSelfHosted } from "@/utils/constants";

export const isFeedbackEnabled = !isSelfHosted;
