export const planIdMonthly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_MONTHLY as string;

export const planIdYearly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_YEARLY as string;

export const isSelfHosted = process.env.NEXT_PUBLIC_SELF_HOSTED === "true";

export const isFeedbackEnabled = false;

export const monthlyPriceUsd = 7;

export const annualPriceUsd = 42;
export const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

export const isOIDCEnabled = process.env.OIDC_ENABLED === "true";

export const oidcName = process.env.OIDC_NAME ?? "OpenID Connect";
