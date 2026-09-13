"use client";

import React from "react";
import type { FooterLink } from "./schema";

const InstanceFooterLinksContext = React.createContext<FooterLink[]>([]);

export function InstanceFooterLinksProvider({
  value,
  children,
}: {
  value: FooterLink[];
  children: React.ReactNode;
}) {
  return (
    <InstanceFooterLinksContext.Provider value={value}>
      {children}
    </InstanceFooterLinksContext.Provider>
  );
}

// Defaults to no links instead of throwing: the consumer is the error
// boundary, which must render even when the tree above it is broken.
export function useInstanceFooterLinks() {
  return React.useContext(InstanceFooterLinksContext);
}
