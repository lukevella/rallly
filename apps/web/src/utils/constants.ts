export const planIdMonthly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_MONTHLY as string;

export const planIdYearly = process.env
  .NEXT_PUBLIC_PRO_PLAN_ID_YEARLY as string;

export const isFeedbackEnabled =
  process.env.NEXT_PUBLIC_FEEDBACK_ENABLED === "true";
