import { cn } from "@rallly/ui";
import { VoteIcon } from "@rallly/ui/vote-icon";
import { LightbulbIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Spinner } from "@/components/spinner";
import { loadInstanceBranding } from "@/features/branding/loaders";
import { loadPollDetails } from "@/features/poll/loaders";
import { PoweredByLink } from "@/features/poll/vote/components/powered-by-link";
import { getTranslation } from "@/i18n/server";
import { StepStage } from "./components/step-stage";
import { VoteTryout } from "./components/vote-tryout";

type PageProps = {
  params: Promise<{ urlId: string }>;
};

async function HelpPageContent({ params }: PageProps) {
  const { urlId } = await params;
  const poll = await loadPollDetails(urlId);

  // The poll page explains why a poll is missing or unavailable.
  if (!poll) {
    redirect(`/invite/${urlId}`);
  }

  const [{ t, i18n }, instanceBranding] = await Promise.all([
    getTranslation(),
    loadInstanceBranding(),
  ]);
  // Attribution can be turned off per instance or per space.
  const hideAttribution =
    instanceBranding.hideAttribution || (poll.space?.hideAttribution ?? false);

  const voteTypes = [
    {
      type: "yes" as const,
      label: t("yes", { defaultValue: "Yes" }),
      description: t("inviteHelpVoteYes", {
        defaultValue: "You can attend at this time.",
      }),
    },
    ...(poll.allowTentativeVotes
      ? [
          {
            type: "ifNeedBe" as const,
            label: t("ifNeedBe", { defaultValue: "If need be" }),
            description: t("inviteHelpVoteIfNeedBe", {
              defaultValue: "You can make it work.",
            }),
          },
        ]
      : []),
    {
      type: "no" as const,
      label: t("no", { defaultValue: "No" }),
      description: t("inviteHelpVoteNo", {
        defaultValue: "You can't attend at this time.",
      }),
    },
  ];

  // Only polls whose times convert to the viewer's zone have one to check.
  const timeZoneTip = poll.timeZone
    ? {
        title: t("inviteHelpTimeZoneTitle", {
          defaultValue: "Check the time zone",
        }),
        description: t("inviteHelpTimeZoneDescription", {
          defaultValue:
            "Times are shown in your time zone. You can change it at the top of the page.",
        }),
      }
    : undefined;

  const changeResponseTip = {
    title: t("inviteHelpChangeTitle", {
      defaultValue: "Change your response",
    }),
    description: t("inviteHelpChangeDescription", {
      defaultValue:
        "You can edit it while the poll is open. Add your email and we'll send you a link to edit it from any device.",
    }),
  };

  const steps: {
    key: "choose" | "save" | "decide";
    title: string;
    description: React.ReactNode;
    extra?: React.ReactNode;
    tip?: { title: string; description: string };
  }[] = [
    {
      key: "choose",
      title: t("inviteHelpChooseTitle", {
        defaultValue: "Choose your availability",
      }),
      description: t("inviteHelpChooseDescription", {
        defaultValue: "On the poll, select an answer for each option:",
      }),
      extra: (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr className="border-b">
              <th scope="col" className="py-2 pr-4 font-medium">
                {t("inviteHelpTableAnswer", { defaultValue: "Answer" })}
              </th>
              <th scope="col" className="py-2 font-medium">
                {t("inviteHelpTableMeaning", { defaultValue: "Meaning" })}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {voteTypes.map(({ type, label, description }) => (
              <tr key={type}>
                <th
                  scope="row"
                  className="whitespace-nowrap py-2.5 pr-4 font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <VoteIcon type={type} />
                    {label}
                  </span>
                </th>
                <td className="py-2.5 text-muted-foreground">{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
      tip: timeZoneTip,
    },
    {
      key: "save",
      title: t("inviteHelpSaveTitle", { defaultValue: "Save your response" }),
      description: (
        <Trans
          t={t}
          i18n={i18n}
          ns="app"
          i18nKey="inviteHelpSaveDescription"
          defaults="Select <b>Continue</b>, enter your name and email address, then select <b>Save availability</b>. The organizer can then see your response."
          components={{ b: <b className="font-medium text-foreground" /> }}
        />
      ),
      tip: changeResponseTip,
    },
    {
      key: "decide",
      title: t("inviteHelpNextTitle", { defaultValue: "What happens next" }),
      description: t("inviteHelpNextDescription", {
        defaultValue:
          "Once everyone has responded, the organizer picks the final time. If you entered your email address, they can send you the details and a calendar invite.",
      }),
    },
  ];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto w-full max-w-4xl px-3 py-10 lg:px-6 lg:py-16"
    >
      <header className="max-w-xl">
        <h1 className="text-balance font-semibold text-3xl tracking-tight">
          {t("inviteHelpTitle", { defaultValue: "How to vote" })}
        </h1>
        <p className="mt-3 text-pretty text-base/7 text-muted-foreground">
          {t("inviteHelpIntro", {
            defaultValue:
              "The organizer wants to find a time that works for everyone. Let them know when you're available. It only takes a minute and you don't need an account.",
          })}
        </p>
      </header>
      <ol className="mt-12 space-y-14 lg:mt-16 lg:space-y-20">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12"
          >
            <div className={cn(index % 2 === 1 && "lg:order-2")}>
              <div className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                {t("inviteHelpStepLabel", {
                  defaultValue: "Step {number}",
                  number: `0${index + 1}`,
                })}
              </div>
              <h2 className="mt-2 font-semibold text-xl tracking-tight">
                {step.title}
              </h2>
              <p className="mt-2 text-pretty text-muted-foreground text-sm/6">
                {step.description}
              </p>
              {step.extra}
              {step.tip ? (
                <aside className="mt-6 flex gap-3 rounded-xl bg-gray-200/60 p-4 dark:bg-gray-800/60">
                  <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">
                      <Trans
                        t={t}
                        i18n={i18n}
                        ns="app"
                        i18nKey="inviteHelpTip"
                        defaults="Tip: {title}"
                        values={{ title: step.tip.title }}
                      />
                    </p>
                    <p className="mt-1 text-pretty text-muted-foreground leading-6">
                      {step.tip.description}
                    </p>
                  </div>
                </aside>
              ) : null}
            </div>
            {step.key === "choose" ? (
              <VoteTryout
                allowTentativeVotes={poll.allowTentativeVotes}
                className="h-72"
              />
            ) : (
              <StepStage step={step.key} className="h-72" />
            )}
          </li>
        ))}
      </ol>
      {hideAttribution ? null : (
        <div className="mt-16 flex justify-center lg:mt-20">
          <PoweredByLink pollId={poll.id} spaceId={poll.spaceId} />
        </div>
      )}
    </main>
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <HelpPageContent {...props} />
    </Suspense>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("inviteHelpTitle", { defaultValue: "How to vote" }),
    robots: { index: false, follow: false },
  };
}
