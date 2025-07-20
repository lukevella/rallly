import type { User } from "@rallly/database";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { defineAbilityFor } from "@/features/ability-manager";
import { getUser } from "@/features/user/queries";
import { auth } from "@/next-auth";

export const createUserDTO = (user: User) => ({
  id: user.id,
  name: user.name,
  image: user.image ?? undefined,
  email: user.email,
  role: user.role,
  activeSpaceId: user.activeSpaceId ?? undefined,
});

export const requireUser = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  return {
    user,
  };
};

export const loadUserAbility = cache(async () => {
  const { user } = await requireUser();

  return {
    user,
    ability: defineAbilityFor(user),
  };
});

export const loadAdminUserAbility = cache(async () => {
  const { user, ability } = await loadUserAbility();

  if (user.role !== "admin") {
    notFound();
  }

  return {
    user,
    ability,
  };
});
