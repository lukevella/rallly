import { isSelfHosted } from "@/utils/constants";

export const isBillingEnabled = !isSelfHosted;
