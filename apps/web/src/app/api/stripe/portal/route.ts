import { stripe } from "@rallly/billing/lib/stripe";
import { createPortalSession } from "@rallly/billing/portal";
import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnPath = formData.get("return_path") as string | null;
  const userSession = await getServerSession();

  if (!userSession?.user.email) {
    // You need to be logged in to subscribe
    const url = new URL(request.url);
    redirect(
      `/login${url ? `?redirect=${encodeURIComponent(url.pathname)}` : ""}`,
    );
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
