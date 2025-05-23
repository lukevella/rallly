import { getUser } from "@/features/user/queries";
import { auth } from "@/next-auth";
import { notFound, redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    notFound();
  }

  return user;
}
