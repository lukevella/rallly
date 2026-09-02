import { Card } from "@rallly/ui/card";
import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";
import { Logo } from "@/features/branding/components/logo";
import { loadUnsubscribeTarget } from "@/features/notifications/loaders";
import { getTranslation } from "@/i18n/server";
import { MutePollForm } from "./components/mute-poll-form";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { t, i18n } = await getTranslation();
  const target = await loadUnsubscribeTarget(token);

  return (
    <div className="flex min-h-dvh flex-col items-center gap-12 py-12">
      <Logo />
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm px-4">
        <Card className="flex w-full flex-col gap-6 p-8 text-center">
          {target?.kind === "poll" ? (
            <MutePollForm
              token={token}
              pollId={target.poll.id}
              pollTitle={target.poll.title}
              initialMuted={target.poll.muted}
            />
          ) : (
            <>
              <h1 className="font-bold text-lg">
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="app"
                  i18nKey="unsubscribeInvalidTitle"
                  defaults="This link is no longer valid"
                />
              </h1>
              <p className="text-muted-foreground text-sm">
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="app"
                  i18nKey="unsubscribeInvalidLinkDescription"
                  defaults="The item it pointed to may have been deleted. You can manage all your email notifications from your <a>notification settings</a>."
                  components={{
                    a: (
                      <a className="text-link" href="/settings/notifications" />
                    ),
                  }}
                />
              </p>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("unsubscribeTitle", { defaultValue: "Unsubscribe" }),
  };
}
