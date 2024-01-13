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
    <div className="lg:hidden shadow-sm bg-gray-100 border-b flex items-center justify-between px-4 py-3">
      <LogoLink />
      <div className="flex gap-x-2.5 justify-end">
        <Link
          href="/settings/profile"
          className="inline-flex items-center w-7 h-9"
        >
          <CurrentUserAvatar size="sm" />
        </Link>
        <Button asChild variant="ghost">
          <Link href="/menu">
            <MenuIcon className="h-4 w-4 text-muted-foreground" />
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
            "hidden lg:flex z-50 inset-y-0 lg:fixed lg:w-72 bg-gray-100 shrink-0 flex-col gap-y-5 overflow-y-auto border-r lg:px-6 lg:py-4 px-5 py-4",
          )}
        >
          <div>
            <LogoLink />
          </div>
          <Sidebar />
        </div>
        <div className={cn("grow overflow-auto lg:pl-72 bg-gray-50")}>
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
