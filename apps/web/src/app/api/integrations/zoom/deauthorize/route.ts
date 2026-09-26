import type { WideEvent } from "@rallly/logger";
import { createWideEvent, logger } from "@rallly/logger";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { removeDeauthorizedZoomUser } from "@/features/conferencing/mutations";
import {
  zoomDeauthorizationPayloadSchema,
  zoomUrlValidationPayloadSchema,
  zoomWebhookEventSchema,
} from "@/features/conferencing/schema";
import {
  createZoomUrlValidationResponse,
  verifyZoomWebhookSignature,
} from "@/features/conferencing/utils";
import { runtime } from "@/lib/effect/runtime";

async function handleZoomEvent(req: NextRequest, event: WideEvent) {
  const secretToken = env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secretToken) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.text();
  // The validation challenge is signed too, and must be verified: answering
  // it unverified would hand anyone an HMAC of a string they choose.
  const verification = await verifyZoomWebhookSignature({
    secretToken,
    signature: req.headers.get("x-zm-signature"),
    timestamp: req.headers.get("x-zm-request-timestamp"),
    body,
    now: new Date(),
  });
  if (!verification.ok) {
    event.errorCode = verification.reason;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = zoomWebhookEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  event.zoomEvent = parsed.data.event;

  switch (parsed.data.event) {
    case "endpoint.url_validation": {
      const payload = zoomUrlValidationPayloadSchema.safeParse(
        parsed.data.payload,
      );
      if (!payload.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      return NextResponse.json(
        await createZoomUrlValidationResponse({
          secretToken,
          plainToken: payload.data.plainToken,
        }),
      );
    }
    case "app_deauthorized": {
      const payload = zoomDeauthorizationPayloadSchema.safeParse(
        parsed.data.payload,
      );
      if (!payload.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      event.zoomUserId = payload.data.user_id;
      const result = await runtime.runPromise(
        removeDeauthorizedZoomUser({ zoomUserId: payload.data.user_id }),
      );
      event.removedConnections = result.removedConnections;
      event.removedCredentials = result.removedCredentials;
      // Acknowledged even when nothing matched: Zoom retries anything else.
      return NextResponse.json({ received: true });
    }
    default:
      return NextResponse.json({ received: true, ignored: true });
  }
}

// Zoom's deauthorization notification endpoint: when a user removes the app
// in the Zoom App Marketplace, Rallly deletes what it stored for them.
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const event = createWideEvent({
    service: "zoom-webhook",
    requestId:
      req.headers.get("x-vercel-id") ??
      req.headers.get("x-request-id") ??
      undefined,
    method: req.method,
    path: req.nextUrl.pathname,
  });

  let response: Response;
  try {
    response = await handleZoomEvent(req, event);
  } catch (error) {
    // A 500 makes Zoom retry, so a failed delete is not lost.
    Sentry.captureException(error);
    event.errorType = error instanceof Error ? error.name : "UnknownError";
    event.errorMessage = error instanceof Error ? error.message : undefined;
    response = NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  event.statusCode = response.status;
  event.durationMs = Date.now() - startTime;
  if (response.status >= 500) {
    logger.error(event);
  } else if (response.status >= 400) {
    logger.warn(event);
  } else {
    logger.info(event);
  }

  return response;
}
