"use client";
import React from "react";

import { useTranslation } from "@/i18n/client";
import { isOwner } from "@/utils/permissions";

import { useRequiredContext } from "./use-required-context";

type UserData = {
  id?: string;
  name: string;
  email?: string;
  isGuest: boolean;
  tier: "guest" | "hobby" | "pro";
  image?: string;
  role: "guest" | "user" | "admin";
};

export const UserContext = React.createContext<{
  user: UserData;
  ownsObject: (obj: {
    userId?: string | null;
    guestId?: string | null;
  }) => boolean;
} | null>(null);

export const useUser = () => {
  return useRequiredContext(UserContext, "UserContext");
};

type BaseUser = {
  id: string;
  tier: "guest" | "hobby" | "pro";
  role: "guest" | "user" | "admin";
  image?: string;
  name?: string;
  email?: string;
};

type RegisteredUser = BaseUser & {
  email: string;
  name: string;
  tier: "hobby" | "pro";
};

type GuestUser = BaseUser & {
  tier: "guest";
};

export const UserProvider = ({
  children,
  user,
}: {
  children?: React.ReactNode;
  user?: RegisteredUser | GuestUser;
}) => {
  const { t } = useTranslation();

  const isGuest = !user || user.tier === "guest";
  const tier = isGuest ? "guest" : user.tier;

  return (
    <UserContext.Provider
      value={{
        user: {
          id: user?.id,
          name: user?.name ?? t("guest"),
          email: user?.email,
          isGuest,
          tier,
          image: user?.image,
          role: user?.role ?? "guest",
        },
        ownsObject: (resource) => {
          return user ? isOwner(resource, { id: user.id, isGuest }) : false;
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
