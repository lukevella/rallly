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
import { redirect } from "next/navigation";
import { env } from "@/env";
import { BrandStyle } from "@/features/branding/components/brand-style";
import { CreatePoll } from "@/features/poll/components/create-poll";
import { getActiveSpaceForUser } from "@/features/space/data";
import { UserDropdown } from "@/features/user/components/user-dropdown";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getSession } from "@/lib/auth";
import { isSelfHosted } from "@/lib/constants";
import { CreatePollFooter } from "./components/create-poll-footer";

export default async function Page() {
  const session = await getSession();
  const userId =
    session?.user.id && !session.user.isGuest ? session.user.id : null;

  const space = userId ? await getActiveSpaceForUser(userId) : null;

  if (userId && !space) {
    redirect("/setup");
  }

  const primaryColor =
    space?.showBranding && space.primaryColor ? space.primaryColor : null;

  return (
    <div className="page-bg-gray-100 absolute inset-0 h-dvh scroll-pt-16 overflow-auto dark:bg-gray-900">
      {primaryColor ? <BrandStyle primaryColor={primaryColor} /> : null}
      <CreatePoll
        nav={
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
        }
        userMenu={<UserDropdown />}
      />
      <CreatePollFooter
        privacyPolicyUrl={
          env.PRIVACY_POLICY_URL ??
          (isSelfHosted ? undefined : "https://rallly.co/privacy-policy")
        }
        termsOfUseUrl={
          env.TERMS_OF_USE_URL ??
          (isSelfHosted ? undefined : "https://rallly.co/terms-of-use")
        }
        supportEmail={env.SUPPORT_EMAIL}
      />
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
