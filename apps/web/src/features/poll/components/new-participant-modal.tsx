import { zodResolver } from "@hookform/resolvers/zod";
import type { VoteType } from "@rallly/database";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { TRPCClientError } from "@trpc/client";
import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { usePoll } from "@/features/poll/client";
import { useAddParticipantMutation } from "@/features/poll/components/mutations";
import VoteIcon from "@/features/poll/components/vote-icon";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";

const requiredEmailSchema = z.object({
  requireEmail: z.literal(true),
  name: z.string().trim().min(1).max(100),
  email: z.email(),
});

const optionalEmailSchema = z.object({
  requireEmail: z.literal(false),
  name: z.string().trim().min(1).max(100),
  email: z.email().or(z.literal("")),
});

const schema = z.union([requiredEmailSchema, optionalEmailSchema]);

interface NewParticipantModalProps {
  votes: { optionId: string; type: VoteType }[];
  onSubmit?: (data: { id: string }) => void;
  onCancel?: () => void;
}

const VoteSummary = ({
  votes,
  className,
}: {
  className?: string;
  votes: { optionId: string; type: VoteType }[];
}) => {
  const { t } = useTranslation();
  const voteByType = votes.reduce<Record<VoteType, string[]>>(
    (acc, vote) => {
      acc[vote.type] = [...acc[vote.type], vote.optionId];
      return acc;
    },
    { yes: [], ifNeedBe: [], no: [] },
  );

  const voteTypes = Object.keys(voteByType) as VoteType[];

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {voteTypes.map((voteType) => {
        const votes = voteByType[voteType];
        const count = votes.length;
        if (count === 0) {
          return null;
        }
        return (
          <div
            key={voteType}
            className="flex h-8 select-none gap-2.5 rounded-lg border p-1 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              <VoteIcon type={voteType} />
              <div className="text-xs">{t(voteType)}</div>
            </div>
            <Badge>{voteByType[voteType].length}</Badge>
          </div>
        );
      })}
    </div>
  );
};

export const NewParticipantForm = (props: NewParticipantModalProps) => {
  const { t } = useTranslation();
  const poll = usePoll();

  const isEmailRequired = poll.requireParticipantEmail;
  const { timeZone } = useDateTimeConfig();
  const { user, createGuestIfNeeded } = useUser();
  const isLoggedIn = user && !user.isGuest;
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      requireEmail: isEmailRequired,
      ...(isLoggedIn
        ? { name: user.name, email: user.email ?? "" }
        : {
            name: "",
            email: "",
          }),
    },
  });

  const { setError, formState, handleSubmit } = form;
  const addParticipant = useAddParticipantMutation();

  if (formState.isSubmitSuccessful) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CircleCheckIcon
            aria-hidden="true"
            className="size-10 text-green-500"
          />
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey="newParticipantDialogSuccessTitle"
                defaults="Your response has been saved"
              />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="newParticipantDialogSuccessDescription"
                defaults="The organizer can now see your availability."
              />
            </DialogDescription>
          </DialogHeader>
        </div>
        <Button className="w-full" onClick={props.onCancel}>
          <Trans
            i18nKey="newParticipantDialogBackToPoll"
            defaults="Back to poll"
          />
        </Button>
        <div className="flex flex-col items-center text-center">
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="newParticipantDialogCreatePollPrompt"
              defaults="Need to schedule something yourself?"
            />
          </p>
          <Link
            href="/new"
            className={buttonVariants({ variant: "link" })}
            onClick={() => {
              posthog?.capture(
                "new_participant_dialog:create_poll_button_click",
                {
                  pollId: poll.id,
                  spaceId: poll.spaceId,
                  tier: poll.space?.tier,
                  $groups: {
                    poll: poll.id,
                    ...(poll.spaceId ? { space: poll.spaceId } : {}),
                  },
                },
              );
            }}
          >
            <Trans
              i18nKey="newParticipantDialogCreatePoll"
              defaults="Create your own poll"
            />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <Trans i18nKey="newParticipant" defaults="New participant" />
        </DialogTitle>
        <DialogDescription>
          <Trans
            i18nKey="newParticipantFormDescription"
            defaults="Fill in the form below to submit your votes."
          />
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={handleSubmit(async (data) => {
            try {
              await createGuestIfNeeded();
              const newParticipant = await addParticipant.mutateAsync({
                name: data.name,
                votes: props.votes,
                email: data.email,
                pollId: poll.id,
                timeZone,
              });
              props.onSubmit?.(newParticipant);
            } catch (error) {
              if (error instanceof TRPCClientError) {
                setError("root", {
                  message: error.message,
                });
              }
            }
          })}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    data-1p-ignore="true"
                    autoFocus={true}
                    disabled={formState.isSubmitting}
                    placeholder={t("namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("email")}
                  {!isEmailRequired ? ` (${t("optional")})` : null}
                </FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    disabled={formState.isSubmitting}
                    placeholder={t("emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <Label>{t("response")}</Label>
            <VoteSummary votes={props.votes} />
          </div>

          {formState.errors.root?.message ? (
            <FormMessage>{formState.errors.root.message}</FormMessage>
          ) : null}
          <div className="mt-6 flex gap-2">
            <Button onClick={props.onCancel}>{t("cancel")}</Button>
            <Button
              type="submit"
              variant="primary"
              loading={formState.isSubmitting}
            >
              {t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
