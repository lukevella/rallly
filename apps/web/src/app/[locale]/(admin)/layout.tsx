"use client";
import { signIn, useSession } from "next-auth/react";
import React from "react";

import { StandardLayout } from "@/components/layouts/standard-layout";
import { isSelfHosted } from "@/utils/constants";

const Auth = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const isAuthenticated = !!session.data?.user.email;

  React.useEffect(() => {
    if (!isAuthenticated) {
      signIn();
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  if (isSelfHosted) {
    return (
      <Auth>
        <StandardLayout>{children}</StandardLayout>
      </Auth>
    );
  }
  return <StandardLayout>{children}</StandardLayout>;
}
