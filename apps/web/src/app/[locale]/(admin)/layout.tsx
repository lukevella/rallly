import { cn } from "@rallly/ui";
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

export default function Layout({ children }: { children: React.ReactNode }) {
  if (isSelfHosted) {
    return <Auth>{children}</Auth>;
  }
  return (
    <div className="lg:flex h-full bg-gray-50">
      <div
        className={cn(
          "hidden lg:flex lg:w-72 bg-gray-100 shrink-0 flex-col gap-y-5 overflow-y-auto border-r lg:px-6 lg:py-5 px-5 py-3",
        )}
      >
        <Link
          href="/"
          className="active:translate-y-1 mb-2 transition-transform"
        >
          <Image alt="Rallly" src="/logo-mark.svg" width={32} height={32} />
        </Link>
        <Sidebar />
      </div>
      <div className={cn("grow overflow-auto bg-gray-50")}>{children}</div>
    </div>
  );
}
