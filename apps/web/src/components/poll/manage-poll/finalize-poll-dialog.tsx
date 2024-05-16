import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogProps,
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
import dayjs from "dayjs";
import { Trans } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PayWallDialogContent } from "@/app/[locale]/poll/[urlId]/pay-wall-dialog-content";
import { trpc } from "@/app/providers";
import { DateIconInner } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";
import { usePoll } from "@/contexts/poll";
import { useDayjs } from "@/utils/dayjs";

const formSchema = z.object({
  selectedOptionId: z.string(),
  notify: z.enum(["none", "all", "attendees"]),
});

type FinalizeFormData = z.infer<typeof formSchema>;

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
  const { adjustTimeZone } = useDayjs();
  const d = adjustTimeZone(start, !poll.timeZone);
  return <DateIconInner dow={d.format("ddd")} day={d.format("D")} />;
}

export const FinalizePollForm = ({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit?: (data: FinalizeFormData) => void;
}) => {
  const poll = usePoll();

  const { adjustTimeZone } = useDayjs();
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

  const form = useForm<FinalizeFormData>({
    defaultValues: {
      selectedOptionId: options[0].id,
      notify: "all",
    },
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
                  <Trans i18nKey="dates" />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-h-96 gap-2 overflow-y-auto rounded-lg border bg-gray-100 p-2"
                  >
                    {options.map((option) => {
                      const start = adjustTimeZone(
                        option.startTime,
                        !poll.timeZone,
                      );

                      const end = adjustTimeZone(
                        dayjs(option.startTime).add(option.duration, "minute"),
                        !poll.timeZone,
                      );

                      return (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "group flex select-none items-start gap-4 rounded-lg border bg-white p-3 text-base",
                            field.value === option.id ? "" : "",
                          )}
                        >
                          <RadioGroupItem id={option.id} value={option.id} />
                          <div className="grow">
                            <div className="flex gap-x-4">
                              <DateIcon start={option.start} />
                              <div className="grow whitespace-nowrap">
                                <div className="text-sm font-medium">
                                  {start.format("LL")}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {option.duration > 0 ? (
                                    `${start.format("LT")} - ${end.format(
                                      "LT",
                                    )}`
                                  ) : (
                                    <Trans
                                      i18nKey="allDay"
                                      defaults="All day"
                                    />
                                  )}
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
        {/* <FormField
          control={form.control}
          name="notify"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="notify" className="mb-4">
                <Trans i18nKey="notify" defaults="Send a calendar invite to" />
              </FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value}>
                  <Label className="flex items-center gap-4 font-normal">
                    <RadioGroupItem value="all" />
                    <Trans
                      i18nKey="notifyAllParticipants"
                      defaults="Everyone"
                    />
                  </Label>
                  <Label className="flex items-center gap-4 font-normal">
                    <RadioGroupItem value="attendees" />
                    <Trans
                      i18nKey="notifyAvailableParticipants"
                      defaults="Attendees"
                    />
                  </Label>
                  <Label className="flex items-center gap-4 font-normal">
                    <RadioGroupItem value="none" />
                    <Trans i18nKey="notifyNo" defaults="None" />
                  </Label>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                <Trans
                  i18nKey="notifyDescription"
                  defaults="Choose which participants should receive a calendar invite"
                />
              </FormDescription>
              {participantsWithoutEmails.length ? (
                <Alert>
                  <AlertCircleIcon className="size-4" />
                  <AlertDescription>
                    <Trans
                      i18nKey="missingEmailsAlert"
                      defaults="The following participants have not provided an email address."
                    />
                  </AlertDescription>
                  <AlertDescription>
                    {participantsWithoutEmails.map((participant) => (
                      <div key={participant.id}>{participant.name}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : null}
            </FormItem>
          )}
        /> */}
      </form>
    </Form>
  );
};

export function FinalizePollDialog(props: DialogProps) {
  const poll = usePoll();
  const queryClient = trpc.useUtils();
  const scheduleEvent = trpc.polls.book.useMutation({
    onSuccess: () => {
      queryClient.invalidate();
    },
  });
  return (
    <Dialog {...props}>
      <PayWallDialogContent>
        <DialogContent size="2xl">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="finalize" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="finalizeDescription"
                defaults="Select a final date for your event."
              />
            </DialogDescription>
          </DialogHeader>
          <FinalizePollForm
            name="finalize-form"
            onSubmit={(data) => {
              scheduleEvent.mutate({
                pollId: poll.id,
                optionId: data.selectedOptionId,
                notify: data.notify,
              });
              props.onOpenChange?.(false);
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button>
                <Trans i18nKey="cancel" />
              </Button>
            </DialogClose>
            <Button
              loading={scheduleEvent.isLoading}
              type="submit"
              form="finalize-form"
              variant="primary"
            >
              <Trans i18nKey="finalize" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </PayWallDialogContent>
    </Dialog>
  );
}
