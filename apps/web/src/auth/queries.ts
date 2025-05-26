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

export const requireAdmin = cache(async () => {
  const user = await requireUser();

  if (user.role !== "admin") {
    if (user.email === process.env.INITIAL_ADMIN_EMAIL) {
      redirect("/admin-setup");
    }
    notFound();
  }

  return user;
});
