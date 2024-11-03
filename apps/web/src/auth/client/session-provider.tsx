"use client";

import type { SessionProviderProps } from "next-auth/react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider(props: SessionProviderProps) {
  return <NextAuthSessionProvider {...props} />;
}
