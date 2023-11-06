"use client";
import { signOut } from "next-auth/react";
import React from "react";

export default function Page() {
  React.useEffect(() => {
    signOut({ callbackUrl: "/login" });
  });
  return null;
}
