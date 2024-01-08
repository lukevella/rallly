import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import React from "react";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
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

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  function SidebarLayout() {
    return (
      <div className="lg:flex h-full bg-gray-50">
        <div className="lg:hidden bg-gray-100 border-b flex items-center justify-between px-4 py-3">
          <Link
            className="active:translate-y-1 transition-transform inline-block"
            href="/"
          >
            <Image
              src="/logo-mark.svg"
              alt="Rallly"
              width={32}
              height={32}
              className="shrink-0"
            />
          </Link>
          <Button asChild variant="ghost">
            <Link href="/menu">
              <MenuIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div
          className={cn(
            "hidden lg:flex lg:w-72 bg-gray-100 shrink-0 flex-col gap-y-5 overflow-y-auto border-r lg:px-6 lg:py-5 px-5 py-3",
          )}
        >
          <div>
            <Link
              className="active:translate-y-1 transition-transform inline-block"
              href="/"
            >
              <Image
                src="/logo-mark.svg"
                priority={true}
                alt="Rallly"
                width={32}
                height={32}
                className="shrink-0"
              />
            </Link>
          </div>
          <Sidebar />
        </div>
        <div className={cn("grow overflow-auto bg-gray-50")}>{children}</div>
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
