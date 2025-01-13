import { prisma } from "@rallly/database";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/auth";
import type { DisableNotificationsPayload } from "@/trpc/types";
import { decryptToken } from "@/utils/session";

export const GET = async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await getServerSession();

  if (!session || !session.user.email) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await decryptToken<DisableNotificationsPayload>(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const watcher = await prisma.watcher.findFirst({
    where: {
      userId: session.user.id,
      pollId: payload.pollId,
    },
  });

  if (watcher) {
    await prisma.watcher.delete({
      where: {
        id: watcher.id,
      },
      select: {
        pollId: true,
      },
    });

    // Set a session cookie to indicate that the user has unsubscribed
    cookies().set(`notifications-unsubscribed-${watcher.pollId}`, "1", {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 5,
    });

    // redirect to poll
    return NextResponse.redirect(new URL(`/poll/${watcher.pollId}`, req.url));
  }

  return NextResponse.redirect(new URL(`/poll/${payload.pollId}`, req.url));
};
