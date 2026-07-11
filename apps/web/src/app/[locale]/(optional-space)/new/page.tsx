import { prisma } from "@rallly/database";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@rallly/ui/breadcrumb";
import { BarChart2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreatePoll } from "@/components/create-poll";
import { UserDropdown } from "@/components/user-dropdown";
import { BrandStyle } from "@/features/branding/components/brand-style";
import { createSpaceDTO } from "@/features/space/data";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getSession } from "@/lib/auth";

const getActiveSpace = async () => {
  const session = await getSession();

  if (session?.user.isGuest || !session?.user.id) {
    return null;
  }

  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId: session?.user.id,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
    include: {
      space: true,
    },
  });

  return spaceMember?.space
    ? createSpaceDTO({ ...spaceMember.space, role: spaceMember.role })
    : null;
};

async function getPrimaryColor() {
  const space = await getActiveSpace();
  if (space) {
    return space.showBranding && space.primaryColor ? space.primaryColor : null;
  }
  return null;
}

export default async function Page() {
  const primaryColor = await getPrimaryColor();

  return (
    <div className="page-bg-gray-100 absolute inset-0 h-dvh overflow-auto dark:bg-gray-900">
      {primaryColor ? <BrandStyle primaryColor={primaryColor} /> : null}
      <div className="sticky top-0 z-20 border-b bg-gray-100/90 p-3 backdrop-blur-md sm:grid-cols-3 dark:bg-gray-900/90">
        <div className="mx-auto flex items-center justify-between gap-x-2">
          <div className="sm:flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href="/polls" />}
                    className="flex items-center gap-x-2"
                  >
                    <BarChart2Icon className="size-4" />
                    <Trans i18nKey="polls" defaults="Polls" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <Trans i18nKey="newPoll" defaults="New Poll" />
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex flex-1 justify-end">
            <UserDropdown />
          </div>
        </div>
      </div>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl p-3 sm:px-6 sm:py-5"
      >
        <CreatePoll />
      </main>
    </div>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("newPoll"),
  };
}
