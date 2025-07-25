"use client";

import { signIn } from "next-auth/react";

export const createGuest = () => {
  return signIn("guest", {
    redirect: false,
  });
};
