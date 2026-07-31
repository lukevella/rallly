import { buttonVariants } from "@rallly/ui";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";
import { linkToApp } from "@/lib/linkToApp";

export async function ClosingCta(props: { locale: string }) {
  const { t } = await getTranslation(props.locale, ["home"]);
  return (
    <section className="text-center">
      <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
        <Trans
          t={t}
          ns="home"
          i18nKey="schedulingPollCtaTitle"
          defaults="Ready to find the best time to meet?"
        />
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-gray-500 sm:text-lg">
        <Trans
          t={t}
          ns="home"
          i18nKey="schedulingPollCtaDescription"
          defaults="Create a free scheduling poll in seconds. No login required."
        />
      </p>
      <div className="mt-8">
        <Link
          href={linkToApp("/new")}
          className={buttonVariants({
            size: "xl",
            variant: "primary",
            className: "shadow-md transition-all active:shadow-none",
          })}
        >
          <Trans t={t} ns="home" i18nKey="createASchedulingPoll" />
        </Link>
      </div>
    </section>
  );
}
