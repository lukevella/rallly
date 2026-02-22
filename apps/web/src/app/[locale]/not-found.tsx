import { Button } from "@rallly/ui/button";
import { GithubIcon, HomeIcon, LifeBuoyIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { ErrorPage, ErrorPageLinkItem } from "@/components/error-page";
import { getTranslation } from "@/i18n/server";

export default async function NotFoundPage() {
  // TODO (Luke Vella) [2023-11-03]: not-found doesn't have access to params right now
  // See: https://github.com/vercel/next.js/discussions/43179
  const { t } = await getTranslation("en");

  return (
    <ErrorPage
      label={t("notFoundLabel", { defaultValue: "404" })}
      title={t("notFoundTitle", { defaultValue: "Page not found" })}
      description={t("notFoundDescription", {
        defaultValue:
          "Sorry, we couldn't find the page you're looking for. Here are some helpful links instead.",
      })}
      actions={
        <Button variant="primary" asChild>
          <Link href="/">
            {t("errorBackToHome", { defaultValue: "Back to home" })}
          </Link>
        </Button>
      }
    >
      <ErrorPageLinkItem
        href="/"
        icon={<HomeIcon className="size-4 text-muted-foreground" />}
        title={t("errorLinkHome", { defaultValue: "Home" })}
        description={t("errorLinkHomeDescription", {
          defaultValue: "Go back to your dashboard.",
        })}
      />
      <ErrorPageLinkItem
        href="/new"
        icon={<PlusIcon className="size-4 text-muted-foreground" />}
        title={t("errorLinkCreatePoll", { defaultValue: "Create a Poll" })}
        description={t("errorLinkCreatePollDescription", {
          defaultValue: "Start scheduling a new meeting.",
        })}
      />
      <ErrorPageLinkItem
        href="https://support.rallly.co"
        icon={<LifeBuoyIcon className="size-4 text-muted-foreground" />}
        title={t("errorLinkSupport", { defaultValue: "Support" })}
        description={t("errorLinkSupportDescription", {
          defaultValue: "Browse our help articles and FAQs.",
        })}
      />
      <ErrorPageLinkItem
        href="https://github.com/lukevella/rallly"
        icon={<GithubIcon className="size-4 text-muted-foreground" />}
        title={t("errorLinkGithub", { defaultValue: "GitHub" })}
        description={t("errorLinkGithubDescription", {
          defaultValue: "Report an issue or check for updates.",
        })}
      />
    </ErrorPage>
  );
}
