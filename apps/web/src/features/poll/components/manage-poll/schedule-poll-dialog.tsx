import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import { toast } from "@rallly/ui/sonner";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DateIconInner } from "@/components/date-icon";
import { useProMonthlyPrice, useTrialState } from "@/features/billing/client";
import { UpgradeButton } from "@/features/billing/components/upgrade-button";
import { startTrial } from "@/features/billing/trial/actions";
import { TrialTerms } from "@/features/billing/trial/components/trial-terms";
import { useParticipants, usePoll } from "@/features/poll/client";
import { ConnectedScoreSummary } from "@/features/poll/components/score-summary";
import { VoteSummaryProgressBar } from "@/features/poll/components/vote-summary-progress-bar";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts } from "@/lib/datetime/format";
import { useSafeAction } from "@/lib/safe-action/client";
import { trpc } from "@/trpc/client";

const formSchema = z.object({
  selectedOptionId: z.string(),
  notify: z.enum(["none", "all", "attendees"]),
});

type ScheduleFormData = z.infer<typeof formSchema>;

type OptionScore = {
  yes: string[];
  ifNeedBe: string[];
  no: string[];
};

const useScoreByOptionId = () => {
  const { participants: responses } = useParticipants();
  const { options } = usePoll();

  return React.useMemo(() => {
    const scoreByOptionId: Record<string, OptionScore> = {};
    options.forEach((option) => {
      scoreByOptionId[option.id] = {
        yes: [],
        ifNeedBe: [],
        no: [],
      };
    });

    responses?.forEach((response) => {
      response.votes.forEach((vote) => {
        scoreByOptionId[vote.optionId]?.[vote.type].push(response.id);
      });
    });

    return scoreByOptionId;
  }, [responses, options]);
};

function DateIcon({ start }: { start: Date }) {
  const poll = usePoll();
  const config = useDateTimeConfig();
  const parts = formatDateParts(start, {
    locale: config.locale,
    // Floating times are stored as UTC wall times; read them unshifted.
    timeZone: poll.timeZone ? config.timeZone : "UTC",
  });
  return <DateIconInner dow={parts.weekday} day={parts.day} />;
}

export const SchedulePollForm = ({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit?: (data: ScheduleFormData) => void;
}) => {
  const poll = usePoll();

  const scoreByOptionId = useScoreByOptionId();
  const { participants } = useParticipants();

  const options = [...poll.options]
    .sort((a, b) => {
      const aYes = scoreByOptionId[a.id].yes.length;
      const bYes = scoreByOptionId[b.id].yes.length;
      const aIfNeedBe = scoreByOptionId[a.id].ifNeedBe.length;
      const bIfNeedBe = scoreByOptionId[b.id].ifNeedBe.length;

      const aTotal = aYes + aIfNeedBe;
      const bTotal = bYes + bIfNeedBe;

      if (aTotal !== bTotal) {
        return bTotal - aTotal;
      }

      if (aYes !== bYes) {
        return bYes - aYes;
      }

      return bIfNeedBe - aIfNeedBe;
    })
    .map((option) => {
      return { ...option, votes: scoreByOptionId[option.id] };
    });

  const form = useForm({
    defaultValues: {
      selectedOptionId: options[0].id,
      notify: "all" as const,
    },
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form
        id={name}
        className="space-y-4"
        onSubmit={form.handleSubmit((data) => {
          onSubmit?.(data);
        })}
      >
        <FormField
          control={form.control}
          name="selectedOptionId"
          render={({ field }) => {
            return (
              <FormItem className="relative">
                <FormLabel htmlFor={field.name}>
                  <Trans i18nKey="dates" defaults="Dates" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-h-96 gap-2 overflow-y-auto rounded-xl bg-gray-100 p-2 dark:bg-gray-900"
                  >
                    {options.map((option) => {
                      const allDay = option.duration === 0;

                      return (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "group flex select-none items-start gap-4 rounded-lg border bg-card p-3 text-base",
                            field.value === option.id ? "" : "",
                          )}
                        >
                          <RadioGroupItem id={option.id} value={option.id} />
                          <div className="grow">
                            <div className="flex gap-x-4">
                              <DateIcon start={option.startTime} />
                              <div className="grow whitespace-nowrap">
                                <div className="font-medium text-sm">
                                  <EventDate
                                    value={option.startTime}
                                    allDay={allDay}
                                    timeZone={poll.timeZone}
                                  />
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  <EventTimeRange
                                    start={option.startTime}
                                    end={
                                      new Date(
                                        option.startTime.getTime() +
                                          option.duration * 60_000,
                                      )
                                    }
                                    allDay={allDay}
                                    timeZone={poll.timeZone}
                                  />
                                </div>
                              </div>
                              <div>
                                <ConnectedScoreSummary optionId={option.id} />
                              </div>
                            </div>
                            <div className="mt-4">
                              <VoteSummaryProgressBar
                                {...scoreByOptionId[option.id]}
                                total={participants.length}
                                showTentative={poll.allowTentativeVotes}
                              />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            );
          }}
        />
      </form>
    </Form>
  );
};

/**
 * Who the calendar invite reaches once a date is picked: the responses
 * that left an email, the same rule the book mutation applies.
 */
function CalendarInviteLine() {
  const { participants } = useParticipants();
  const withEmail = participants.filter(
    (participant) => participant.email,
  ).length;

  return (
    <p className="text-muted-foreground text-sm">
      {withEmail > 0 ? (
        <Trans
          i18nKey="scheduleCalendarInviteCount"
          defaults="A calendar invite goes to everyone who left an email when they answered. {count} of {total} left one."
          values={{ count: withEmail, total: participants.length }}
        />
      ) : (
        <Trans
          i18nKey="scheduleCalendarInviteNone"
          defaults="A calendar invite goes to everyone who left an email when they answered. Nobody did on this poll, so you will tell them yourself."
        />
      )}
    </p>
  );
}

export function SchedulePollDialog(props: DialogProps) {
  const poll = usePoll();
  const router = useRouter();
  const trialState = useTrialState();
  const price = useProMonthlyPrice();
  const { t } = useTranslation();
  const { formatDateTime } = useDateTime();
  const scheduleEvent = trpc.polls.book.useMutation({
    onSuccess: () => router.refresh(),
  });
  // Scheduling is paid. Before a trial the press starts the 14 free days
  // and then schedules; the terms sit above the buttons. After the trial
  // the primary button goes to checkout.
  const start = useSafeAction(startTrial, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(
          t("trialStartedToast", {
            defaultValue:
              "Your 14 free days of Pro started, free until {date}.",
            date: formatDateTime(data.endsAt, "monthDay"),
          }),
        );
      }
    },
  });

  return (
    <Dialog {...props}>
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="schedulePoll" defaults="Schedule" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="schedulePollDescription"
              defaults="Select a final date for your event."
            />
          </DialogDescription>
        </DialogHeader>
        <SchedulePollForm
          name="schedule-form"
          onSubmit={async (data) => {
            if (trialState === "eligible") {
              const result = await start.executeAsync();
              if (!result?.data) {
                // Refused; the action's toast said why.
                return;
              }
            }
            scheduleEvent.mutate({
              pollId: poll.id,
              optionId: data.selectedOptionId,
              notify: data.notify,
            });
            props.onOpenChange?.(false);
          }}
        />
        <CalendarInviteLine />
        <TrialTerms action="schedule" />
        <DialogFooter>
          <DialogClose render={<Button />}>
            <Trans i18nKey="cancel" />
          </DialogClose>
          {trialState === "ended" ? (
            <UpgradeButton size="default">
              <Trans
                i18nKey="upgradeToProPrice"
                defaults="Upgrade to Pro, {price} a month"
                values={{ price }}
              />
            </UpgradeButton>
          ) : (
            <Button
              loading={scheduleEvent.isPending || start.isExecuting}
              type="submit"
              form="schedule-form"
              variant="primary"
            >
              {trialState === "eligible" ? (
                <Trans
                  i18nKey="scheduleAndStartTrial"
                  defaults="Schedule and start 14 free days"
                />
              ) : (
                <Trans i18nKey="schedulePoll" defaults="Schedule" />
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
