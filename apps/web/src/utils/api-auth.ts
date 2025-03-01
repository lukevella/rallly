import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Checks if the request is authorized using the API secret
 * @returns A NextResponse with 401 status if unauthorized, or null if authorized
 */
export async function checkApiAuthorization() {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}
