import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Form, FormControl, FormField, FormItem } from "@rallly/ui/form";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import dayjs from "dayjs";
import { Trans } from "next-i18next";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DateIcon } from "@/components/date-icon";
import { ParticipantAvatarBar } from "@/components/participant-avatar-bar";
import { useParticipants } from "@/components/participants-provider";
import { VoteSummaryProgressBar } from "@/components/vote-summary-progress-bar";
import { usePoll } from "@/contexts/poll";

const formSchema = z.object({
  selectedOptionId: z.string(),
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

export const FinalizePollForm = ({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit: (data: FinalizeFormData) => void;
}) => {
  const poll = usePoll();
  const [max, setMax] = React.useState(3);

  const scoreByOptionId = useScoreByOptionId();
  const { participants } = useParticipants();

  const options = [...poll.options]
    .sort((a, b) => {
      const aYes = scoreByOptionId[a.id].yes.length;
      const bYes = scoreByOptionId[b.id].yes.length;

      if (aYes !== bYes) {
        return bYes - aYes;
      }

      const aIfNeedBe = scoreByOptionId[a.id].ifNeedBe.length;
      const bIfNeedBe = scoreByOptionId[b.id].ifNeedBe.length;

      return bIfNeedBe - aIfNeedBe;
    })
    .map((option) => {
      return { ...option, votes: scoreByOptionId[option.id] };
    });

  const form = useForm<FinalizeFormData>({
    defaultValues: {
      selectedOptionId: options[0].id,
    },
  });

  return (
    <Form {...form}>
      <form id={name} onSubmit={form.handleSubmit(onSubmit)}>
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
                    {options.slice(0, max).map((option) => {
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
                            "group flex select-none items-center gap-4 rounded-md border bg-white p-3 text-base",
                            field.value === option.id
                              ? "bg-gray-50"
                              : "hover:bg-gray-50 active:bg-gray-100",
                          )}
                        >
                          <div className="hidden">
                            <RadioGroupItem id={option.id} value={option.id} />
                          </div>
                          <div>
                            <DateIcon date={dayjs(option.start)} />
                          </div>
                          <div className="grow">
                            <div className="flex">
                              <div className="grow whitespace-nowrap">
                                <div className="text-sm font-semibold">
                                  {option.duration > 0
                                    ? date.format("LL")
                                    : date.format("LL")}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {option.duration > 0 ? (
                                    date.format("LT")
                                  ) : (
                                    <Trans
                                      i18nKey="allDay"
                                      defaults="All day"
                                    />
                                  )}
                                </div>
                              </div>
                              <div>
                                <ParticipantAvatarBar
                                  participants={attendees}
                                  max={5}
                                />
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
              </FormItem>
            );
          }}
        />
        {max < options.length ? (
          <div className="mt-4">
            <Button
              className="mt-full w-full"
              onClick={() => {
                setMax((oldMax) => oldMax + 3);
              }}
            >
              <Trans i18nKey="showMore" />
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
};
