"use client";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { MenuIcon, XIcon } from "lucide-react";
import { useToggle } from "react-use";

import { Sidebar } from "@/app/[locale]/(admin)/sidebar";
import { UserDropdown } from "@/components/user-dropdown";

export function PageContainer({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("", className)}>{children}</div>;
}

export function PageTitle({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-semibold leading-9", className)}>{children}</h2>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, toggle] = useToggle(false);
  return (
    <div
      className={cn(
        "flex sticky top-0 bg-gray-50 z-20 lg:px-6 lg:py-4 border-b px-4 py-3 justify-between",
        className,
      )}
    >
      <div className="flex gap-x-4">
        <Button
          className="lg:hidden"
          onClick={() => {
            toggle();
          }}
          variant="ghost"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
        <div>{children}</div>
      </div>
      <div>
        <UserDropdown />
      </div>
      {open ? (
        <div className="fixed bg-gray-100 overflow-auto inset-0">
          <div className="sticky top-0 px-4 py-3">
            <Button variant="ghost" onClick={() => toggle(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-6 py-5">
            <Sidebar />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PageContent({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("lg:px-6 lg:py-5 px-4 py-3", className)}>{children}</div>
  );
}
