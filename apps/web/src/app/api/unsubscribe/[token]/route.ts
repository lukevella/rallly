import { NextResponse } from "next/server";
import { unsubscribeWithToken } from "@/features/notifications/mutations";

type Context = { params: Promise<{ token: string }> };

/**
 * RFC 8058 one-click unsubscribe target. Mail clients POST here straight from
 * the `List-Unsubscribe` header with no session, so the signed token in the
 * path is the only credential.
 */
export async function POST(_request: Request, { params }: Context) {
  const { token } = await params;
  const result = await unsubscribeWithToken({ token });

  if (!result.ok && result.reason === "invalidToken") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // An item that no longer exists (or changed owner) has nothing left to
  // mute; the client's intent is satisfied either way.
  return NextResponse.json({ ok: true });
}

// Clients that open the header link in a browser instead of posting land on
// the confirmation page. Nothing is muted on GET so link prefetchers can't
// trigger it.
export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  return NextResponse.redirect(
    new URL(`/unsubscribe/${encodeURIComponent(token)}`, request.url),
    303,
  );
}
