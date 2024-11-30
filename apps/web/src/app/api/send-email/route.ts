import * as Sentry from "@sentry/nextjs";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getEmailClient } from "@/utils/emails";

const emailClient = getEmailClient();

export const POST = verifySignatureAppRouter(async (req: NextRequest) => {
  const body = await req.json();

  try {
    await emailClient.sendTemplate(body.templateName, body.options);
  } catch (error) {
    Sentry.captureException(error);
  }

  return NextResponse.json({ success: true });
});
