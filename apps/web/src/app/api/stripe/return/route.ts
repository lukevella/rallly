import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { BILLING_FLASH_KEY } from "@/features/billing/constants";
import { billingReturnFlowSchema } from "@/features/billing/schema";
import { FLASH_MAX_AGE, flashCookieName } from "@/lib/flash/constants";

/**
 * Where Stripe portal flows land after completion. Carries which flow finished
 * as a one-shot flash so the billing page can confirm it without a query
 * parameter surviving in the URL. Unknown or missing flows still redirect.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/settings/billing", request.nextUrl.origin),
  );

  const flow = billingReturnFlowSchema.safeParse(
    request.nextUrl.searchParams.get("flow"),
  );

  if (flow.success) {
    response.cookies.set(flashCookieName(BILLING_FLASH_KEY), flow.data, {
      path: "/",
      maxAge: FLASH_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}
