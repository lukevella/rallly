import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import React from "react";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { LogoLink } from "@/app/components/logo-link";
import { CurrentUserAvatar } from "@/components/user";
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

function MobileNavigation() {
  return (
    <div className="flex items-center justify-between border-b bg-gray-100 px-4 py-3 shadow-sm lg:hidden">
      <LogoLink />
      <div className="flex justify-end gap-x-2.5">
        <Link
          href="/settings/profile"
          className="inline-flex h-9 w-7 items-center"
        >
          <CurrentUserAvatar size="sm" />
        </Link>
        <Button asChild variant="ghost">
          <Link href="/menu">
            <MenuIcon className="text-muted-foreground h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  function SidebarLayout() {
    return (
      <div className="bg-gray-50">
        <MobileNavigation />
        <div
          className={cn(
            "inset-y-0 z-50 hidden shrink-0 flex-col gap-y-5 overflow-y-auto border-r bg-gray-100 px-5 py-4 lg:fixed lg:flex lg:w-72 lg:px-6 lg:py-4",
          )}
        >
          <div>
            <LogoLink />
          </div>
          <Sidebar />
        </div>
        <div className={cn("min-h-screen grow bg-gray-50 lg:pl-72")}>
          {children}
        </div>
      </div>
    );
  }

  if (isSelfHosted) {
    return (
      <Auth>
        <SidebarLayout />
      </Auth>
    );
  }
  return <SidebarLayout />;
}
