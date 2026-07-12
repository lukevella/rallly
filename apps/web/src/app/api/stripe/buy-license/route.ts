import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createLicenseCheckoutSession } from "@/features/licensing/mutations";
import { licenseCheckoutProductSchema } from "@/features/licensing/schema";

export async function GET(request: NextRequest) {
  const product = licenseCheckoutProductSchema.parse(
    request.nextUrl.searchParams.get("product"),
  );

  const result = await createLicenseCheckoutSession({ product });

  if ("url" in result) {
    return NextResponse.redirect(result.url, 303);
  }

  return NextResponse.json({ error: result.error }, { status: 500 });
}
