import { stripe } from "@rallly/billing/lib/stripe";
import { createPortalSession } from "@rallly/billing/portal";
import { prisma } from "@rallly/database";
import * as Sentry from "@sentry/nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnPath = formData.get("return_path") as string | null;
  const userSession = await getServerSession();

  if (!userSession?.user.email) {
    // You need to be logged in to subscribe
    const redirectUrl = new URL("/login", request.nextUrl.origin);
    redirectUrl.searchParams.set("redirect", returnPath ?? "/");
    return NextResponse.redirect(redirectUrl);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userSession.user.id,
    },
    select: {
      name: true,
      email: true,
      customerId: true,
    },
  });

  if (!user) {
    // TODO: Logout user
    return NextResponse.redirect("/login");
  }

  let customerId = user.customerId ?? undefined;

  if (!customerId) {
    // create customer
    const customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    });
    customerId = customer.id;
    await prisma.user.update({
      where: {
        id: userSession.user.id,
      },
      data: {
        customerId,
      },
    });
  }

  const portalSession = await createPortalSession({
    returnPath: returnPath ?? undefined,
    customerId,
  });

  redirect(portalSession.url);
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    Sentry.captureException(new Error("session_id is required"));
    return NextResponse.redirect("/login");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const customerId = session.customer as string;

  if (!customerId) {
    Sentry.captureException(new Error("customer_id is required"));
    return NextResponse.redirect("/login");
  }

  const portalSession = await createPortalSession({
    customerId,
  });

  return NextResponse.redirect(portalSession.url);
}
