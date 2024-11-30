import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import type { NextRequest } from "next/server";

export async function verifySignature(
  handler: (req: NextRequest) => Promise<Response>,
) {
  /**
   * We need to call verifySignatureAppRouter inside the route handler
   * to avoid the build breaking when env vars are not set.
   */
  return (req: NextRequest) => verifySignatureAppRouter(handler)(req);
}
