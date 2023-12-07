import clsx from "clsx";
import { CreditCardIcon, Settings2Icon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Trans } from "react-i18next";
import { useToggle } from "react-use";

import { IfCloudHosted } from "@/contexts/environment";

import { IconComponent } from "../../types";
import { IfAuthenticated, useUser } from "../user-provider";

const MenuItem = (props: {
  icon: IconComponent;
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  return (
    <Link
      className={clsx(
        "flex min-w-0 items-center gap-x-2.5 px-3 py-2 text-sm font-medium",
        pathname === props.href
          ? "bg-gray-200"
          : "text-gray-500 hover:text-gray-800",
      )}
      href={props.href}
    >
      <props.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{props.children}</span>
    </Link>
  );
};

export const ProfileLayout = ({ children }: React.PropsWithChildren) => {
  // reset toggle whenever route changes
  const pathname = usePathname();

  const [, toggle] = useToggle(false);

  React.useEffect(() => {
    toggle(false);
  }, [pathname, toggle]);

  return (
    <div className="bg-gray-50 h-full">
      <div className="relative h-full">
        <div className="border-b px-4 py-3">
          <div className="flex gap-x-2">
            <IfAuthenticated>
              <MenuItem href="/settings/profile" icon={UserIcon}>
                <Trans i18nKey="profile" defaults="Profile" />
              </MenuItem>
            </IfAuthenticated>
            <MenuItem href="/settings/preferences" icon={Settings2Icon}>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </MenuItem>
            <IfCloudHosted>
              <MenuItem href="/settings/billing" icon={CreditCardIcon}>
                <Trans i18nKey="billing" defaults="Billing" />
              </MenuItem>
            </IfCloudHosted>
          </div>
        </div>
        <div className="max-w-2xl grow">{children}</div>
      </div>
    </div>
  );
};
