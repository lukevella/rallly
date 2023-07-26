import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
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

import { DateIcon } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";
import { useDateFormatter, usePoll } from "@/contexts/poll";

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
    const res = options.reduce<Record<string, OptionScore>>((acc, option) => {
      acc[option.id] = { yes: [], ifNeedBe: [], no: [] };
      return acc;
    }, {});

    const votes = responses.flatMap((response) => response.votes);

    for (const vote of votes) {
      if (!res[vote.optionId]) {
        res[vote.optionId] = { yes: [], ifNeedBe: [], no: [] };
      }

      switch (vote.type) {
        case "yes":
          res[vote.optionId].yes.push(vote.participantId);
          break;
        case "ifNeedBe":
          res[vote.optionId].ifNeedBe.push(vote.participantId);
          break;
        case "no":
          res[vote.optionId].no.push(vote.participantId);
          break;
      }
    }
    return res;
  }, [responses, options]);
};

const pageSize = 5;

export const FinalizePollForm = ({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit?: (data: FinalizeFormData) => void;
}) => {
  const poll = usePoll();
  const [max, setMax] = React.useState(pageSize);

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

  const dateFormatter = useDateFormatter();
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
        onSubmit={form.handleSubmit((data) => onSubmit?.(data))}
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
                    className="grid gap-2"
                  >
                    {options.slice(0, max).map((option) => {
                      const start = dateFormatter(option.start);
                      const end = dateFormatter(
                        dayjs(option.start).add(option.duration, "minute"),
                      );
                      return (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "group flex select-none items-center gap-4 rounded-md border bg-white p-3 text-base",
                            field.value === option.id
                              ? "bg-primary-50 border-primary"
                              : "hover:bg-gray-50",
                          )}
                        >
                          <div className="hidden">
                            <RadioGroupItem id={option.id} value={option.id} />
                          </div>
                          <div>
                            <DateIcon date={start} />
                          </div>
                          <div className="grow">
                            <div className="flex">
                              <div className="grow whitespace-nowrap">
                                <div className="text-sm font-semibold">
                                  {option.duration > 0
                                    ? start.format("LL")
                                    : start.format("LL")}
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
                            <div className="mt-2">
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
                {max < options.length ? (
                  <div className="absolute bottom-0 mt-2 w-full bg-gradient-to-t from-white via-white to-white/10 py-8 px-3">
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setMax((oldMax) => oldMax + pageSize);
                      }}
                    >
                      <Trans i18nKey="showMore" />
                    </Button>
                  </div>
                ) : null}
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
                  <AlertCircleIcon className="h-4 w-4" />
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
