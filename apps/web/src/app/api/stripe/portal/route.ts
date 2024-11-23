import { stripe } from "@rallly/billing";
import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";

async function getReturnPath(request: NextRequest) {
  try {
    const formData = await request.formData();
    const returnPath = formData.get("return_path");
    if (
      typeof returnPath !== "string" ||
      !returnPath.startsWith("/") ||
      returnPath.includes("..")
    ) {
      Sentry.captureException(new Error(`Invalid return path: ${returnPath}`));
      return;
    }
    return returnPath;
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function POST(request: NextRequest) {
  const returnPath = await getReturnPath(request);

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
      metadata: {
        userId: userSession.user.id,
      },
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

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: absoluteUrl(returnPath),
    });
    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.redirect("/login");
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    Sentry.captureException(new Error("Session ID is required"));
    return NextResponse.redirect("/login");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (typeof session.customer !== "string") {
    Sentry.captureException(new Error("Invalid customer ID in session"));
    return NextResponse.redirect("/login");
  }

  const customerId = session.customer;

  if (!customerId) {
    Sentry.captureException(new Error("Session has no customer ID"));
    return NextResponse.redirect("/login");
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
    });
    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.redirect("/login");
  }
}
