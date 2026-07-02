"use client";

import { useUser } from "@/components/user-provider";

export function usePreferredTimeFormat() {
  const { user } = useUser();
  return user?.timeFormat;
}
