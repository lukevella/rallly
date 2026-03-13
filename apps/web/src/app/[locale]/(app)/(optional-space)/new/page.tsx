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
import { isQuickCreateEnabled } from "@/features/quick-create";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import {
  createPrivateSSRHelper,
  createPublicSSRHelper,
} from "@/trpc/server/create-ssr-helper";

export default async function Page() {
  const helpers = isQuickCreateEnabled
    ? await createPublicSSRHelper()
    : await createPrivateSSRHelper();

  await helpers.user.getMe.prefetch();

  return (
    <div className="absolute inset-0 h-dvh overflow-auto bg-gray-100 dark:bg-gray-900">
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
      <div className="mx-auto max-w-4xl p-3 sm:px-6 sm:py-5">
        <CreatePoll />
      </div>
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
