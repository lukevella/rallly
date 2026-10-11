"use client";

import { posthog } from "@rallly/posthog/client";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { Separator } from "@rallly/ui/separator";
import { toast } from "@rallly/ui/sonner";
import { EyeIcon, SendIcon, TagIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React from "react";
import {
  useProMonthlyPrice,
  useTier,
  useTrial,
  useTrialState,
} from "@/features/billing/client";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { PLAN_NAMES } from "@/features/billing/constants";
import { startTrial } from "@/features/billing/trial/actions";
import { usePoll } from "@/features/poll/client";
import { InviteByEmail } from "@/features/poll/components/invite-by-email";
import { InviteEmailPreview } from "@/features/poll/components/invite-email-preview";
import { InviteLinkRow } from "@/features/poll/components/invite-link-row";
import { SharePollSettings } from "@/features/poll/components/share-settings";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime } from "@/lib/datetime/client";
import { useSafeAction } from "@/lib/safe-action/client";

type Route = "free" | "pro";

/**
 * One of the two cards on step one. The same three questions on both: who
 * sends it, what you see, what it costs. The radio sits in the corner.
 */
function RouteCard({
  value,
  title,
  badge,
  lines,
}: {
  value: Route;
  title: React.ReactNode;
  badge?: React.ReactNode;
  lines: [React.ReactNode, React.ReactNode, React.ReactNode];
}) {
  const id = `share-route-${value}`;
  const icons = [SendIcon, EyeIcon, TagIcon];

  return (
    <label
      htmlFor={id}
      className="relative flex cursor-pointer flex-col gap-3 rounded-xl border border-card-border bg-card p-4 transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5"
    >
      <RadioGroupItem
        value={value}
        id={id}
        className="absolute top-4 right-4"
      />
      <h3 className="flex items-center gap-2 pr-8 font-medium text-base">
        {title}
        {badge}
      </h3>
      <ul className="space-y-2">
        {lines.map((line, index) => {
          const Icon = icons[index];
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed order, one icon per question
              key={index}
              className="flex gap-2 text-muted-foreground text-sm"
            >
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 translate-y-0.5"
              />
              <span>{line}</span>
            </li>
          );
        })}
      </ul>
    </label>
  );
}

function ChooseRoute({
  route,
  onRouteChange,
  onContinue,
  isStarting,
  created,
}: {
  route: Route | null;
  onRouteChange: (route: Route) => void;
  onContinue: () => void;
  isStarting: boolean;
  created: boolean;
}) {
  const poll = usePoll();
  const trialState = useTrialState();
  const { trialEndsAt } = useTrial();
  const price = useProMonthlyPrice();
  const { formatDateTime } = useDateTime();
  const canTry = trialState === "eligible";

  return (
    <Card>
      <CardHeader>
        <CardTitle id="share-route-title">
          {created ? (
            <Trans
              i18nKey="sharePageCreatedTitle"
              defaults="Poll created. How should it reach people?"
            />
          ) : (
            <Trans
              i18nKey="sharePageTitle"
              defaults="How should it reach people?"
            />
          )}
        </CardTitle>
        {trialState === "ended" && trialEndsAt ? (
          <CardDescription>
            <Trans
              i18nKey="trialEndedOn"
              defaults="Your 14 free days ended on {date}."
              values={{ date: formatDateTime(trialEndsAt, "monthDay") }}
            />
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          aria-labelledby="share-route-title"
          // null rather than undefined: the group is controlled from the first
          // render, with nothing picked, so Base UI never sees it switch modes.
          value={route}
          onValueChange={(value) => onRouteChange(value as Route)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <RouteCard
            value="free"
            title={<Trans i18nKey="planFree" defaults="Free" />}
            lines={[
              <Trans
                key="sends"
                i18nKey="shareFreeCardSends"
                defaults="One link. The emailing is yours."
              />,
              <Trans
                key="sees"
                i18nKey="shareFreeCardSees"
                defaults="Answers only. Keeping track of who has replied is yours."
              />,
              <Trans
                key="costs"
                i18nKey="shareFreeCardCosts"
                defaults="Nothing to pay."
              />,
            ]}
          />
          <RouteCard
            value="pro"
            title={PLAN_NAMES.PRO}
            badge={
              <Badge size="sm" variant="secondary">
                {canTry ? (
                  <Trans
                    i18nKey="shareProCardTrialPill"
                    defaults="14 days free"
                  />
                ) : (
                  <Trans
                    i18nKey="priceAMonth"
                    defaults="{price} a month"
                    values={{ price }}
                  />
                )}
              </Badge>
            }
            lines={[
              <Trans
                key="sends"
                i18nKey="shareProCardSends"
                defaults="Rallly sends the invites, one personal link each."
              />,
              <Trans
                key="sees"
                i18nKey="shareProCardSees"
                defaults="Rallly keeps track: who opened, who answered, who still hasn't."
              />,
              canTry ? (
                <Trans
                  key="costs"
                  i18nKey="shareProCardTrialCosts"
                  defaults="14 days free, no card. {price} a month after."
                  values={{ price }}
                />
              ) : (
                <Trans
                  key="costs"
                  i18nKey="shareProCardCosts"
                  defaults="{price} a month. Your 14 free days were used."
                  values={{ price }}
                />
              ),
            ]}
          />
        </RadioGroup>
        {route === null ? null : (
          <div className="flex justify-end">
            {route === "free" ? (
              <Button variant="primary" onClick={onContinue}>
                <Trans i18nKey="continue" defaults="Continue" />
              </Button>
            ) : canTry ? (
              <Button
                variant="primary"
                loading={isStarting}
                onClick={onContinue}
              >
                <Trans
                  i18nKey="continueAndStartTrial"
                  defaults="Continue and start 14 free days"
                />
              </Button>
            ) : (
              <UpgradeButton
                size="default"
                onClick={() => {
                  posthog?.capture("poll_share:upgrade_button_click", {
                    poll_id: poll.id,
                  });
                }}
              >
                <Trans
                  i18nKey="upgradeToProPrice"
                  defaults="Upgrade to Pro, {price} a month"
                  values={{ price }}
                />
              </UpgradeButton>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProShareScreen({ showSettings }: { showSettings: boolean }) {
  const poll = usePoll();
  const trialState = useTrialState();
  const { trialEndsAt } = useTrial();
  const { formatDateTime } = useDateTime();

  // One card, in the order she should read it: the switches first (on the
  // creation visit only; later the page is sharing alone, the Edit settings
  // page has the form), then the sending, then the plain link.
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="sharePollTitle" defaults="Share your poll" />
        </CardTitle>
        <CardDescription>
          {trialState === "trial" && trialEndsAt ? (
            <Trans
              i18nKey="proFreeUntil"
              defaults="Pro, free until {date}"
              values={{ date: formatDateTime(trialEndsAt, "monthDay") }}
            />
          ) : trialState === "ended" && trialEndsAt ? (
            <Trans
              i18nKey="trialEndedOn"
              defaults="Your 14 free days ended on {date}."
              values={{ date: formatDateTime(trialEndsAt, "monthDay") }}
            />
          ) : (
            <Trans
              i18nKey="shareDialogDescription"
              defaults="Share the invite link, or invite people by email."
            />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings ? (
          <>
            <SharePollSettings />
            <Separator />
          </>
        ) : null}
        <div className="space-y-3">
          <InviteByEmail />
          <InviteEmailPreview />
        </div>
        <Separator />
        <div className="space-y-3">
          <p className="font-medium text-sm">
            <Trans
              i18nKey="sharePageLinkTitle"
              defaults="Prefer to paste the link yourself?"
            />
          </p>
          <InviteLinkRow inviteLink={poll.inviteLink} />
        </div>
      </CardContent>
    </Card>
  );
}

function FreeShareScreen({
  showSettings,
  onChoosePro,
}: {
  showSettings: boolean;
  onChoosePro?: () => void;
}) {
  const poll = usePoll();
  const trialState = useTrialState();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans i18nKey="sharePollTitle" defaults="Share your poll" />
        </CardTitle>
        <CardDescription>
          {onChoosePro ? (
            trialState === "eligible" ? (
              <Trans
                i18nKey="shareFreeTryPro"
                defaults="Free. <0>Try Pro free for 14 days instead</0>"
                components={[
                  <button
                    key="pro"
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={onChoosePro}
                  />,
                ]}
              />
            ) : (
              <Trans
                i18nKey="shareFreeSeePro"
                defaults="Free. <0>See what Pro does</0>"
                components={[
                  <button
                    key="pro"
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={onChoosePro}
                  />,
                ]}
              />
            )
          ) : (
            <Trans i18nKey="planFree" defaults="Free" />
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings ? (
          <>
            <SharePollSettings fields={["enableComments"]} />
            <Separator />
          </>
        ) : null}
        <InviteLinkRow inviteLink={poll.inviteLink} />
      </CardContent>
    </Card>
  );
}

/**
 * The share page in two steps. Step one is the choice between the two
 * routes and, for Pro, the activation: Continue starts the 14 free days.
 * Step two is the share screen for the route. The page opens on step two
 * whenever the space is Pro (trial, paying or otherwise) or the poll has
 * invites; once on the Pro screen there is no way back, while the Free
 * screen can still cross to Pro. The sharing settings show on the creation
 * visit only (the one Create sends her to); a later visit through the
 * Share button is sharing alone. A closed or scheduled poll never offers
 * the trial: nothing can be sent on it, so it opens on the share screen of
 * its current route and the Free screen does not cross to Pro.
 */
export function SharePage({ hasInvites }: { hasInvites: boolean }) {
  const poll = usePoll();
  const { user } = useUser();
  const tier = useTier();
  const { t } = useTranslation();
  const { formatDateTime } = useDateTime();
  const searchParams = useSearchParams();
  const created = searchParams.has("created");

  const isGuest = !user || user.isGuest;
  const isOpenPoll = poll.status === "open";
  // A guest cannot hold a trial, and a closed poll has nothing to send:
  // neither is asked the question.
  const opensOnShare = tier === "pro" || hasInvites || isGuest || !isOpenPoll;
  const currentRoute: Route = tier === "pro" || hasInvites ? "pro" : "free";

  const [step, setStep] = React.useState<1 | 2>(opensOnShare ? 2 : 1);
  const [route, setRoute] = React.useState<Route | null>(
    opensOnShare ? currentRoute : null,
  );

  const start = useSafeAction(startTrial, {
    onSuccess: ({ data }) => {
      posthog?.capture("poll_share:trial_start", { poll_id: poll.id });
      if (data) {
        toast.success(
          t("trialStartedToast", {
            defaultValue:
              "Your 14 free days of Pro started, free until {date}.",
            date: formatDateTime(data.endsAt, "monthDay"),
          }),
        );
      }
      setStep(2);
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: once per visit
  React.useEffect(() => {
    posthog?.capture("poll_share:page_open", {
      poll_id: poll.id,
      step,
      source: created ? "poll_created" : "manual",
    });
  }, []);

  if (step === 2 && route === "pro") {
    return <ProShareScreen showSettings={created} />;
  }

  if (step === 2 && route === "free") {
    return (
      <FreeShareScreen
        showSettings={created}
        onChoosePro={
          isGuest || !isOpenPoll
            ? undefined
            : () => {
                setRoute("pro");
                setStep(1);
              }
        }
      />
    );
  }

  return (
    <ChooseRoute
      route={route}
      onRouteChange={setRoute}
      isStarting={start.isExecuting}
      created={created}
      onContinue={() => {
        posthog?.capture("poll_share:route_continue", {
          poll_id: poll.id,
          route,
        });
        if (route === "pro") {
          start.execute({ source: "share" });
        } else {
          setStep(2);
        }
      }}
    />
  );
}
