import { VoteIcon } from "@rallly/ui/vote-icon";
import { LightbulbIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import type { PollDetails } from "@/features/poll/types";
import { getTranslation } from "@/i18n/server";
import { StepStage } from "./step-stage";

/** How to vote, step by step. The sheet around it carries the title. */
export async function InviteHelp({ poll }: { poll: PollDetails }) {
  const { t, i18n } = await getTranslation();

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
            "Times are shown in your time zone. You can change it on this page.",
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
      description: poll.allowTentativeVotes
        ? t("inviteHelpChooseRadioDescription", {
            defaultValue:
              "Each option can be answered yes, if need be or no. With a keyboard or screen reader, use the arrow keys or Space to choose. With a mouse, select the row to change the answer:",
          })
        : t("inviteHelpChooseRadioNoTentativeDescription", {
            defaultValue:
              "Each option can be answered yes or no. With a keyboard or screen reader, use the arrow keys or Space to choose. With a mouse, select the row to change the answer:",
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
                  <span className="flex items-center gap-2">
                    <VoteIcon round type={type} className="size-4" />
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
          i18nKey="inviteHelpSubmitDescription"
          defaults="Select <b>Continue</b>, enter your name and email address, then select <b>Confirm</b>. The organizer can then see your response."
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
    <div>
      <p className="text-pretty text-muted-foreground text-sm/6">
        {t("inviteHelpIntro", {
          defaultValue:
            "The organizer wants to find a time that works for everyone. Let them know when you're available. It only takes a minute and you don't need an account.",
        })}
      </p>
      <ol className="mt-8 space-y-10">
        {steps.map((step, index) => (
          <li key={step.key} className="grid gap-6">
            <div>
              <div className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                {t("inviteHelpStepLabel", {
                  defaultValue: "Step {number}",
                  number: `0${index + 1}`,
                })}
              </div>
              <h3 className="mt-2 font-semibold text-lg tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-pretty text-muted-foreground text-sm/6">
                {step.description}
              </p>
              {step.extra}
              {step.tip ? (
                <aside className="mt-6 flex gap-3 rounded-xl bg-gray-200/60 p-4 dark:bg-gray-700/70">
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
            {step.key === "choose" ? null : (
              <StepStage step={step.key} className="h-72" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
