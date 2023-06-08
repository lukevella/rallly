import { trpc } from "@rallly/backend";
import { LoaderIcon, RotateCcwIcon, Users2Icon } from "@rallly/icons";
import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@rallly/ui/form";
import { Label } from "@rallly/ui/label";
import { RadioGroup, RadioGroupItem } from "@rallly/ui/radio-group";
import dayjs from "dayjs";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DateIcon } from "@/components/date-icon";
import { useParticipants } from "@/components/participants-provider";
import VoteIcon from "@/components/poll/vote-icon";
import { Trans } from "@/components/trans";
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
    <div className="flex h-2 grow overflow-hidden rounded bg-slate-100">
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

const VoteSummary = (props: {
  total: number;
  yes: string[];
  ifNeedBe: string[];
  no: string[];
}) => {
  const pending =
    props.total - props.yes.length - props.ifNeedBe.length - props.no.length;
  return (
    <span className="inline-flex gap-3 text-sm font-semibold tabular-nums">
      <span className="flex items-center gap-1.5">
        <Users2Icon className="h-5 w-5" />
        <span>
          {props.yes.length + props.ifNeedBe.length}
          <span className="text-gray-400">{`/${props.total}`}</span>
        </span>
      </span>
      {props.ifNeedBe.length ? (
        <span className="flex items-center gap-1.5">
          <VoteIcon type="ifNeedBe" />
          {props.ifNeedBe.length}
        </span>
      ) : null}
      {pending ? (
        <span className="flex items-center gap-1.5">
          <LoaderIcon className="h-4 w-4" />
          {pending}
        </span>
      ) : null}
    </span>
  );
};

export const FinalizePollDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <Form {...form}>
          <form
            id={formName}
            onSubmit={form.handleSubmit(async (data) => {
              await bookDate.mutateAsync({
                pollId: poll.id,
                optionId: data.selectedOptionId,
              });
              onOpenChange(false);
            })}
          >
            <FormField
              control={form.control}
              name="selectedOptionId"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey="selectOption" defaults="Select Option" />
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="bg-pattern max-h-[500px] overflow-y-auto rounded-md border p-3"
                      >
                        {options.map((option) => {
                          const date = dayjs(option.start).utc();
                          return (
                            <Label
                              key={option.id}
                              htmlFor={option.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-md border bg-white p-4 pl-3 hover:bg-gray-50 active:bg-gray-100",
                                field.value === option.id ? "" : "",
                              )}
                            >
                              <RadioGroupItem
                                id={option.id}
                                value={option.id}
                              />
                              <div className="flex grow gap-4">
                                <div>
                                  <DateIcon date={date} />
                                </div>
                                <div className="grow space-y-4">
                                  <div className="text-muted-foreground font-normal">
                                    {option.duration > 0
                                      ? date.format("LLL")
                                      : date.format("LL")}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <VoteSummaryProgressBar
                                      {...scoreByOptionId[option.id]}
                                      total={participants.length}
                                    />
                                  </div>
                                  <div>
                                    <VoteSummary
                                      {...scoreByOptionId[option.id]}
                                      total={participants.length}
                                    />
                                  </div>
                                </div>
                              </div>
                            </Label>
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
        <DialogFooter className="sm:justify-between">
          <div>
            <Button
              loading={reopen.isLoading}
              icon={RotateCcwIcon}
              onClick={async () => {
                await reopen.mutateAsync({ pollId: poll.id });
                onOpenChange(false);
              }}
            >
              <Trans i18nKey="reopen" defaults="Reopen" />
            </Button>
          </div>
          <div className="flex gap-x-2">
            <Button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <Trans i18nKey="cancel" />
            </Button>
            <Button
              type="submit"
              loading={form.formState.isSubmitting}
              form={formName}
              variant="primary"
            >
              <Trans i18nKey="book" defaults="Book" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
