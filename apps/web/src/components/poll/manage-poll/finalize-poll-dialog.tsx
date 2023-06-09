import { trpc } from "@rallly/backend";
import { ArrowRightIcon, HashIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Form, FormControl, FormField, FormItem } from "@rallly/ui/form";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import dayjs from "dayjs";
import { Trans } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DateIcon } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { usePoll } from "@/contexts/poll";

const formName = "finalize-form";

const formSchema = z.object({
  selectedOptionId: z.string(),
});

type FinalizeFormData = z.infer<typeof formSchema>;

export const VoteSummaryProgressBar = (props: {
  total: number;
  yes: string[];
  ifNeedBe: string[];
  no: string[];
}) => {
  return (
    <div className="flex h-1.5 grow overflow-hidden rounded bg-slate-100">
      <div
        className="h-full bg-green-500"
        style={{
          width: (props.yes.length / props.total) * 100 + "%",
        }}
      />
      <div
        className="h-full bg-amber-400"
        style={{
          width: (props.ifNeedBe.length / props.total) * 100 + "%",
        }}
      />
      <div
        className="h-full bg-gray-300"
        style={{
          width: (props.no.length / props.total) * 100 + "%",
        }}
      />
    </div>
  );
};

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

export const FinalizePollDialog = () => {
  const poll = usePoll();
  const form = useForm<FinalizeFormData>({
    defaultValues: {
      selectedOptionId: poll.selectedOptionId ?? poll.options[0].id,
    },
  });

  const { participants } = useParticipants();

  const scoreByOptionId = useScoreByOptionId();

  const options = [...poll.options].sort((a, b) => {
    const aScore =
      scoreByOptionId[a.id].yes.length + scoreByOptionId[a.id].ifNeedBe.length;
    const bScore =
      scoreByOptionId[b.id].yes.length + scoreByOptionId[b.id].ifNeedBe.length;
    return bScore - aScore;
  });

  const queryClient = trpc.useContext();
  const bookDate = trpc.polls.book.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  const reopen = trpc.polls.reopen.useMutation({
    onSuccess: () => {
      queryClient.polls.invalidate();
    },
  });

  return (
    <Form {...form}>
      <form
        id={formName}
        onSubmit={form.handleSubmit(async (data) => {
          await bookDate.mutateAsync({
            pollId: poll.id,
            optionId: data.selectedOptionId,
          });
        })}
      >
        <FormField
          control={form.control}
          name="selectedOptionId"
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid gap-2"
                  >
                    {options.map((option, index) => {
                      const attendees = participants.filter((participant) =>
                        participant.votes.some(
                          (vote) =>
                            vote.optionId === option.id &&
                            (vote.type === "yes" || vote.type === "ifNeedBe"),
                        ),
                      );
                      const date = dayjs(option.start).utc();
                      return (
                        <label
                          key={option.id}
                          htmlFor={option.id}
                          className={cn(
                            "group flex cursor-pointer items-center gap-4 rounded-md border bg-white p-3 pr-8 text-base hover:bg-gray-50 active:bg-gray-100",
                            field.value === option.id ? "" : "",
                          )}
                        >
                          <RadioGroupItem
                            className="hidden"
                            id={option.id}
                            value={option.id}
                          />
                          <div className="text-muted-foreground flex items-center gap-0.5 text-xs">
                            <HashIcon className="h-3 w-3" />
                            {`${index + 1}`}
                          </div>
                          <div>
                            <DateIcon date={date} />
                          </div>
                          <div className="grow">
                            <div className="text-sm font-semibold">
                              {option.duration > 0
                                ? date.format("LL")
                                : date.format("LL")}
                            </div>
                            <div className="text-muted-foreground">
                              {option.duration > 0 ? (
                                date.format("LT")
                              ) : (
                                <Trans i18nKey="allDay" defaults="All day" />
                              )}
                            </div>
                          </div>
                          <div className="w-48">
                            <VoteSummaryProgressBar
                              {...scoreByOptionId[option.id]}
                              total={participants.length}
                            />
                          </div>
                          <div>
                            <ConnectedScoreSummary optionId={option.id} />
                          </div>
                          <div className="transition-transform group-hover:translate-x-1 group-active:translate-x-2">
                            <ArrowRightIcon className="text-muted-foreground inline-block h-4 w-4 " />
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
