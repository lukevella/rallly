import { redirect } from "next/navigation";
import { defineAbilityFor } from "@/features/ability-manager";
import { getUser } from "@/features/user/queries";
import { auth } from "@/next-auth";

export const isInitialAdmin = (email: string) => {
  return email.toLowerCase() === process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
};

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
