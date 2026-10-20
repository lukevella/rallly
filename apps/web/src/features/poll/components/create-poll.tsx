"use client";
import { buttonVariants, cn } from "@rallly/ui";
import { badgeVariants } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rallly/ui/card";
import { Form } from "@rallly/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { toast } from "@rallly/ui/sonner";
import { TRPCClientError } from "@trpc/client";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm, useFormContext } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { Link } from "@/components/link";
import type { ConferencingOptions } from "@/features/conferencing/components/conferencing-field";
import { toPollConferencing } from "@/features/conferencing/components/conferencing-field";
import { PollDetailsForm } from "@/features/poll/components/forms/poll-details-form";
import PollOptionsForm from "@/features/poll/components/forms/poll-options-form/poll-options-form";
import {
  hasMixedOptionTypes,
  isAllDay,
} from "@/features/poll/components/forms/poll-options-form/utils";
import { PollSettingsForm } from "@/features/poll/components/forms/poll-settings";
import type { NewEventData } from "@/features/poll/components/forms/types";
import { SelectedOptionsCount } from "@/features/poll/components/selected-options-count";
import { SHARE_POLL_FLASH_KEY } from "@/features/poll/constants";
import {
  hideOpenPollLimit,
  showOpenPollLimit,
} from "@/features/poll/limit/client";
import type { OpenPollUsage } from "@/features/poll/limit/types";
import { isAtOpenPollLimit } from "@/features/poll/limit/utils";
import {
  isPollFormOptionPast,
  PAST_POLL_OPTIONS_MESSAGE,
} from "@/features/poll/utils";
import { useUser } from "@/features/user/client";
import { UserDropdown } from "@/features/user/components/user-dropdown";
import { Trans, useTranslation } from "@/i18n/client";
import { useCurrentTime } from "@/lib/datetime/use-current-time";
import { setFlash } from "@/lib/flash/client";
import { createSessionStorage } from "@/lib/session-storage";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import { trpc } from "@/trpc/client";

const draftStorage = createSessionStorage();

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

const GuestModeBadge = () => {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              badgeVariants(),
              "cursor-pointer hover:bg-card-accent focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          />
        }
      >
        <Trans i18nKey="guest" defaults="Guest" />
      </PopoverTrigger>
      <PopoverContent align="end" className="max-w-xs">
        <h3 className="font-medium text-sm">
          <Trans i18nKey="createPollGuestModeTitle" defaults="Guest mode" />
        </h3>
        <p className="mt-1 text-pretty text-muted-foreground text-sm">
          <Trans
            i18nKey="createPollGuestModeDescription"
            defaults="Guest polls can only be managed from the browser they were created in. Log in to manage them from any device."
          />
        </p>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Keeps poll creation disabled and explains why while any selected option
 * falls in the past according to the poll's effective time zone.
 */
const CreatePollActions = ({
  createdPollId,
}: {
  createdPollId: string | null;
}) => {
  const form = useFormContext<NewEventData>();
  const { user } = useUser();
  const options = form.watch("options") || [];
  const allDay = isAllDay(options);
  const timeZone =
    form.watch("lockTimeZone") && !allDay
      ? "UTC"
      : form.watch("timeZone") || user?.timeZone || getBrowserTimeZone();
  const now = useCurrentTime();
  const hasPastOption =
    now !== null &&
    options.some((option) => isPollFormOptionPast({ option, now, timeZone }));

  if (createdPollId) {
    return (
      <output className="flex h-9 items-center gap-x-1.5 rounded-full bg-green-600/10 px-3.5 font-medium text-green-600 text-sm dark:bg-green-500/10 dark:text-green-500">
        <CheckIcon className="size-4 shrink-0" />
        <Trans i18nKey="createPollFooterCreated" defaults="Created" />
      </output>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {hasPastOption ? (
        <span className="text-destructive text-xs" role="alert">
          <Trans
            i18nKey="weekCalendarPastOptionWarning"
            defaults="You can't choose a date or time in the past."
          />
        </span>
      ) : null}
      <Button
        className="rounded-full px-4"
        form="create-poll"
        disabled={hasPastOption}
        loading={form.formState.isSubmitting}
        type="submit"
        variant="primary"
      >
        {form.formState.isSubmitting ? (
          <Trans i18nKey="createPollFooterCreating" defaults="Creating…" />
        ) : (
          <Trans i18nKey="createPoll" defaults="Create poll" />
        )}
      </Button>
    </div>
  );
};

/**
 * Renders the poll creation flow and rechecks options immediately before
 * submitting, since an option can pass while the form remains open.
 */
export const CreatePoll = ({
  nav,
  conferencing,
  openPollUsage,
}: {
  nav?: React.ReactNode;
  conferencing?: ConferencingOptions | null;
  openPollUsage?: OpenPollUsage | null;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, createGuestIfNeeded } = useUser();
  const isLoggedIn = !!user && !user.isGuest;
  const [createdPollId, setCreatedPollId] = React.useState<string | null>(null);
  // There is no CSS selector for "sticky element is stuck": a sentinel after
  // the bar tells us when it has settled into its natural resting position.
  const [isDocked, setIsDocked] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      setIsDocked(entries[entries.length - 1].isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  const form = useForm<NewEventData>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      conferencingProvider: "",
      conferencingUrl: "",
      conferencingLabel: "",
      view: "month",
      options: [],
      hideScores: false,
      hideParticipants: false,
      aggregateResultsOnly: false,
      enableComments: false,
      allowTentativeVotes: true,
      duration: 60,
      lockTimeZone: false,
    },
  });

  // Drafts saved before mixed changes were held back can mix date and time
  // options, which the calendar can't render. Keep the time slots, matching
  // how the calendar classified the list. Must be stable: the persist hook
  // restores the draft again whenever this callback changes.
  const { setValue } = form;
  const handleDataRestored = React.useCallback(
    (data: Partial<NewEventData>) => {
      if (data.options && hasMixedOptionTypes(data.options)) {
        setValue(
          "options",
          data.options.filter((option) => option.type === "timeSlot"),
        );
      }
    },
    [setValue],
  );

  const { clear } = useFormPersist("new-poll", {
    storage: draftStorage,
    watch: form.watch,
    setValue: form.setValue,
    onDataRestored: handleDataRestored,
  });

  const makePoll = trpc.polls.make.useMutation();

  // Explain the limit before the organizer fills in a form they can't submit.
  // The form persists, so it survives closing a poll to make room. The count
  // is the server's at page load, so the poll created here can't trip it.
  React.useEffect(() => {
    if (!openPollUsage) {
      return;
    }
    if (isAtOpenPollLimit(openPollUsage)) {
      showOpenPollLimit("create", openPollUsage);
    } else {
      hideOpenPollLimit("create");
    }
  }, [openPollUsage]);

  // The client router reuses a page it rendered in the last minute
  // (staleTimes.dynamic), so a /new loaded before the organizer opened or
  // closed polls would show the old count. Render it fresh once on arrival.
  const hasRefreshedUsage = React.useRef(false);
  React.useEffect(() => {
    if (openPollUsage && !hasRefreshedUsage.current) {
      hasRefreshedUsage.current = true;
      router.refresh();
    }
  }, [openPollUsage, router]);

  return (
    <Form {...form}>
      <header className="sticky top-0 z-20 bg-gray-100/90 p-3 backdrop-blur-md xl:bg-transparent xl:backdrop-blur-none dark:bg-gray-900/90 dark:xl:bg-transparent">
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex min-w-0 flex-1 items-center">
            {/* The back link is not prefetched: a guest gets bounced from "/"
                to a bare /login, and that redirect is cached against the space
                layout the whole dashboard shares, so any later navigation into
                that subtree lands on /login instead of where it was headed. */}
            {isLoggedIn ? (
              nav
            ) : (
              <Link
                href="/"
                prefetch={false}
                className={buttonVariants({ variant: "ghost" })}
              >
                <ArrowLeftIcon className="size-4" />
                <Trans i18nKey="back" defaults="Back" />
              </Link>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-x-2">
            {!isLoggedIn ? <GuestModeBadge /> : null}
            <UserDropdown />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-3 lg:pt-6"
      >
        <form
          id="create-poll"
          onSubmit={form.handleSubmit(async (formData) => {
            const title = required(formData.title.trim());
            const options = required(formData.options);
            const allDay = isAllDay(options);
            const timeZone =
              formData.lockTimeZone && !allDay
                ? "UTC"
                : formData.timeZone || user?.timeZone || getBrowserTimeZone();

            if (
              options.some((option) =>
                isPollFormOptionPast({
                  option,
                  now: new Date(),
                  timeZone,
                }),
              )
            ) {
              toast.error(
                t("weekCalendarPastOptionWarning", {
                  defaultValue: "You can't choose a date or time in the past.",
                }),
              );
              return;
            }

            const session = await createGuestIfNeeded();
            if (!session.ok) {
              toast.error(
                session.reason === "tooManyRequests"
                  ? t("actionErrorTooManyRequests", {
                      defaultValue: "You are making too many requests",
                    })
                  : t("guestSessionUnavailableError", {
                      defaultValue:
                        "We couldn't start a session for you. Check that cookies are enabled and try again.",
                    }),
              );
              return;
            }
            let res: Awaited<ReturnType<typeof makePoll.mutateAsync>>;
            try {
              res = await makePoll.mutateAsync({
                title,
                location: formData.location.trim(),
                conferencing: toPollConferencing(formData),
                description: formData.description.trim(),
                // Send a zone to validate floating date options against the
                // organizer's calendar. Locked time polls are interpreted as UTC.
                timeZone: formData.lockTimeZone && !allDay ? null : timeZone,
                hideParticipants: formData.hideParticipants,
                aggregateResultsOnly: formData?.aggregateResultsOnly,
                disableComments: !formData.enableComments,
                hideScores: formData.hideScores,
                allowTentativeVotes: formData.allowTentativeVotes,
                requireParticipantEmail: formData.requireParticipantEmail,
                options: options.map((option) => ({
                  startDate:
                    option.type === "date" ? option.date : option.start,
                  endDate: option.type === "timeSlot" ? option.end : undefined,
                  maxParticipants: option.maxParticipants ?? null,
                })),
              });
            } catch (error) {
              if (
                error instanceof TRPCClientError &&
                error.data?.code === "BAD_REQUEST" &&
                error.message === PAST_POLL_OPTIONS_MESSAGE
              ) {
                toast.error(
                  t("weekCalendarPastOptionWarning", {
                    defaultValue:
                      "You can't choose a date or time in the past.",
                  }),
                );
                return;
              }
              throw error;
            }

            if (res.ok) {
              // The persist hook re-saves on every render, so clearing storage
              // alone is not enough — reset the form so defaults get persisted
              clear();
              form.reset();
              setCreatedPollId(res.data.id);
              setFlash(SHARE_POLL_FLASH_KEY, res.data.id);
              router.push(`/poll/${res.data.id}`);
            } else if (res.error.code === "OPEN_POLL_LIMIT_REACHED") {
              showOpenPollLimit("create", res.error.usage);
            } else {
              toast.error(
                t("inappropriateContent", {
                  defaultValue: "Inappropriate content",
                }),
                {
                  action: {
                    label: t("learnMore", { defaultValue: "Learn more" }),
                    onClick: () => {
                      window.open(
                        "https://support.rallly.co/guide/content-moderation",
                        "_blank",
                      );
                    },
                  },
                },
              );
            }
          })}
        >
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans i18nKey="event" defaults="Event" />
                </CardTitle>
                <CardDescription>
                  <Trans
                    i18nKey="describeYourEvent"
                    defaults="Describe what your event is about"
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PollDetailsForm conferencing={conferencing} />
              </CardContent>
            </Card>

            <PollOptionsForm />

            <PollSettingsForm />
          </div>
        </form>
        <div className="pointer-events-none sticky bottom-0 z-20 flex justify-center pt-4 pb-6 lg:pb-16">
          <div
            className={cn(
              "pointer-events-auto flex w-full items-center justify-between gap-x-4 rounded-full border border-popover-border bg-popover py-2 pr-2 pl-5 transition-[max-width,box-shadow] duration-300",
              isDocked
                ? "max-w-full shadow-none"
                : "max-w-md shadow-2xl shadow-black/40",
            )}
          >
            <p className="min-w-0 truncate text-muted-foreground text-sm">
              <SelectedOptionsCount />
            </p>
            <div className="shrink-0">
              <CreatePollActions createdPollId={createdPollId} />
            </div>
          </div>
        </div>
        {/* Overlaps the bar's bottom padding: a hairline sentinel sitting
            exactly on the viewport edge misses intersection under fractional
            scaling, so give it height inside the resting zone. */}
        <div ref={sentinelRef} className="-mt-6 h-6" aria-hidden="true" />
      </main>
    </Form>
  );
};
