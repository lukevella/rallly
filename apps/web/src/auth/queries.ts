import { defineAbilityFor } from "@/features/ability-manager";
import { getDefaultSpace, getSpace } from "@/features/spaces/queries";
import { getUser } from "@/features/user/queries";
import { auth } from "@/next-auth";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

/**
 * @deprecated - Use requireUserAbility() instead
 */
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
  const { user } = await requireUserAbility();

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/admin-setup");
    }
    notFound();
  }

  return user;
});

export const getActiveSpace = cache(async () => {
  const { user } = await requireUserAbility();

  if (user.activeSpaceId) {
    const activeSpace = await getSpace({ id: user.activeSpaceId });

    if (activeSpace) {
      return activeSpace;
    }

    console.warn(
      `User ${user.id} has an active space ID ${user.activeSpaceId} that does not exist or is no longer accessible`,
    );
  }

  return await getDefaultSpace();
});

export const requireUserAbility = cache(async () => {
  const user = await requireUser();
  return {
    user,
    ability: defineAbilityFor(user, {
      isInitialAdmin: isInitialAdmin(user.email),
    }),
  };
});
