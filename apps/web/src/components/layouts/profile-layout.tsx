import { Settings2Icon, SettingsIcon, UserIcon } from "@rallly/icons";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { Trans } from "react-i18next";

import { Card } from "@/components/card";
import { Container } from "@/components/container";
import { StandardLayout } from "@/components/layouts/standard-layout";
import {
  TopBar,
  TopBarTitle,
} from "@/components/layouts/standard-layout/top-bar";

import { IconComponent, NextPageWithLayout } from "../../types";
import { IfAuthenticated } from "../user-provider";

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
      <props.icon className="h-4 w-4" />
      {props.children}
    </Link>
  );
};

export const ProfileLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex h-full grow flex-col">
      <TopBar className="flex justify-between gap-8">
        <TopBarTitle
          icon={SettingsIcon}
          title={<Trans defaults="Settings" i18nKey="settings" />}
        />
      </TopBar>
      <div>
        <Container className="px-0 py-4 sm:py-8">
          <Card className="mx-auto max-w-4xl" fullWidthOnMobile={true}>
            <div className="flex gap-4 border-b bg-gray-50 p-3">
              <IfAuthenticated>
                <MenuItem href="/settings/profile" icon={UserIcon}>
                  <Trans i18nKey="profile" defaults="Profile" />
                </MenuItem>
              </IfAuthenticated>
              <MenuItem href="/settings/preferences" icon={Settings2Icon}>
                <Trans i18nKey="preferences" defaults="Preferences" />
              </MenuItem>
            </div>
            {children}
          </Card>
        </Container>
      </div>
    </div>
  );
};

export const getProfileLayout: NextPageWithLayout["getLayout"] =
  function getLayout(page) {
    return (
      <StandardLayout>
        <ProfileLayout>{page}</ProfileLayout>
      </StandardLayout>
    );
  };
