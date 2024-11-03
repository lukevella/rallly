"use client";

import React from "react";

import type { User } from "../schema";

const GuestContext = React.createContext<User | null>(null);

export function GuestProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return <GuestContext.Provider value={user}>{children}</GuestContext.Provider>;
}

export function useGuestUser() {
  return React.useContext(GuestContext);
}
