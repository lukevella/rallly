import { redirect } from "next/navigation";
import { getUser } from "@/features/user/queries";
import { defineAbilityFor } from "@/lib/ability-manager";
import { auth } from "@/next-auth";

export const requireUserAbility = async () => {
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
    ability: defineAbilityFor(user),
  };
};
