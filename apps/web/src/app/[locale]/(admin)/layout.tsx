import { signIn, useSession } from "next-auth/react";
import React from "react";

import { SidebarLayout } from "@/app/[locale]/(admin)/sidebar-layout";
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
        <SidebarLayout>{children}</SidebarLayout>
      </Auth>
    );
  }
  return <SidebarLayout>{children}</SidebarLayout>;
}
