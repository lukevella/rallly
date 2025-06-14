import { getDefaultSpace } from "@/features/spaces/queries";
import { getUser } from "@/features/user/queries";
import { auth } from "@/next-auth";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  return user;
});

export const isInitialAdmin = cache((email: string) => {
  return email.toLowerCase() === process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
});

export const requireAdmin = cache(async () => {
  const user = await requireUser();

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/admin-setup");
    }
    notFound();
  }

  return user;
});

export const getActiveSpace = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return null;
  }

  const space = await getDefaultSpace({ ownerId: user.id });

  return space;
});
