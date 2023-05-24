import { AdjustmentsIcon, CogIcon, UserIcon } from "@rallly/icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Trans } from "react-i18next";

import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";

import { IconComponent, NextPageWithLayout } from "../../types";
import { IfAuthenticated, UserProvider } from "../user-provider";

const MenuItem = (props: {
  icon: IconComponent;
  href: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  return (
    <Link
      className={clsx(
        "flex items-center gap-2 text-sm font-medium",
        router.asPath === props.href
          ? "text-primary-600"
          : "text-gray-500 hover:text-gray-800",
      )}
      href={props.href}
    >
      <props.icon className="h-4" />
      {props.children}
    </Link>
  );
};

export const ProfileLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex h-full grow flex-col">
      <TopBar className="space-y-3">
        <div className="">
          <TopBarTitle
            icon={CogIcon}
            title={<Trans defaults="Settings" i18nKey="settings" />}
          />
        </div>
        <hr />
        <div className="flex justify-between">
          <div className="flex gap-6">
            <IfAuthenticated>
              <MenuItem href="/settings/profile" icon={UserIcon}>
                <Trans i18nKey="profile" defaults="Profile" />
              </MenuItem>
            </IfAuthenticated>
            <MenuItem href="/settings/preferences" icon={AdjustmentsIcon}>
              <Trans i18nKey="preferences" defaults="Preferences" />
            </MenuItem>
          </div>
        </div>
      </TopBar>
      <div className="grow bg-white">{children}</div>
    </div>
  );
};

export const getProfileLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <UserProvider>
        <StandardLayout>
          <ProfileLayout>{page}</ProfileLayout>
        </StandardLayout>
      </UserProvider>
    );
  };
