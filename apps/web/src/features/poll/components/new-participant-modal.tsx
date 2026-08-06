import { zodResolver } from "@hookform/resolvers/zod";
import type { VoteType } from "@rallly/database";
import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { MaxCharLength } from "@rallly/ui/max-char-length";
import { Textarea } from "@rallly/ui/textarea";
import { TRPCClientError } from "@trpc/client";
import { CircleCheckIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { IfCloudHosted } from "@/components/environment";
import { usePoll } from "@/features/poll/client";
import { useAddParticipantMutation } from "@/features/poll/components/mutations";
import VoteIcon from "@/features/poll/components/vote-icon";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";
import { useUser } from "@/features/user/client";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";

const requiredEmailSchema = z.object({
  requireEmail: z.literal(true),
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  note: z.string().max(MAX_RESPONSE_NOTE_LENGTH).optional(),
});

const optionalEmailSchema = z.object({
  requireEmail: z.literal(false),
  name: z.string().trim().min(1).max(100),
  email: z.email().or(z.literal("")),
  note: z.string().max(MAX_RESPONSE_NOTE_LENGTH).optional(),
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
  const counts = votes.reduce(
    (acc, vote) => {
      acc[vote.type] += 1;
      return acc;
    },
    { yes: 0, ifNeedBe: 0, no: 0 },
  );

  const total = votes.length;
  const availableCount = counts.yes;
  const ifNeedBeCount = counts.ifNeedBe;

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center gap-3 rounded-lg border border-input bg-background/80 px-2.5 dark:bg-foreground/5",
        className,
      )}
    >
      {availableCount > 0 ? (
        <span className="flex items-center gap-1.5 text-foreground text-sm">
          <VoteIcon type="yes" className="size-4" />
          <Trans
            i18nKey="voteSummaryAvailable"
            defaults="{availableCount} of {total} available"
            values={{ availableCount, total }}
          />
        </span>
      ) : ifNeedBeCount === 0 ? (
        <span className="flex items-center gap-1.5 text-foreground text-sm">
          <VoteIcon type="no" className="size-4" />
          <Trans
            i18nKey="voteSummaryNotAvailable"
            defaults="You're not available"
          />
        </span>
      ) : null}
      {ifNeedBeCount > 0 ? (
        <>
          {availableCount > 0 ? (
            <span aria-hidden="true" className="h-4 w-px bg-input" />
          ) : null}
          <span className="flex items-center gap-1.5 text-foreground text-sm">
            <VoteIcon type="ifNeedBe" className="size-4" />
            <Trans
              i18nKey="voteSummaryIfNeedBe"
              defaults="{count} if need be"
              values={{ count: ifNeedBeCount }}
            />
          </span>
        </>
      ) : null}
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
      note: "",
      ...(isLoggedIn
        ? { name: user.name, email: user.email ?? "" }
        : {
            name: "",
            email: "",
          }),
    },
  });

  const { setError, formState, handleSubmit, watch } = form;

  const getSubmitErrorMessage = (error: unknown) => {
    if (error instanceof TRPCClientError && error.data) {
      if (error.data.appError === "POLL_FULL") {
        return t("newParticipantFormErrorPollFull", {
          defaultValue: "This poll is no longer accepting responses.",
        });
      }
      switch (error.data.code) {
        case "TOO_MANY_REQUESTS":
          return t("newParticipantFormErrorTooManyRequests", {
            defaultValue:
              "You have made too many attempts. Please wait a while and try again.",
          });
        case "UNAUTHORIZED":
          return t("newParticipantFormErrorUnauthorized", {
            defaultValue:
              "We couldn't verify your session. Please refresh the page and try again.",
          });
      }
    }
    return t("newParticipantFormSubmitError", {
      defaultValue:
        "Your response could not be saved. Please check your connection and try again.",
    });
  };
  const noteLength = watch("note")?.length ?? 0;
  const [showNote, setShowNote] = React.useState(false);
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
        <IfCloudHosted>
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
        </IfCloudHosted>
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
          id="new-participant-form"
          onSubmit={handleSubmit(async (data) => {
            try {
              await createGuestIfNeeded();
              const newParticipant = await addParticipant.mutateAsync({
                name: data.name,
                votes: props.votes,
                email: data.email,
                note: data.note,
                pollId: poll.id,
                timeZone,
              });
              props.onSubmit?.(newParticipant);
            } catch (error) {
              setError("root", { message: getSubmitErrorMessage(error) });
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
                  {!isEmailRequired
                    ? ` (${t("optional", { defaultValue: "optional" })})`
                    : null}
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
            <Label>{t("response", { defaultValue: "Response" })}</Label>
            <VoteSummary votes={props.votes} />
          </div>

          {showNote ? (
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t("newParticipantFormNoteLabel", {
                        defaultValue: "Note for the organizer",
                      })}
                    </FormLabel>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-muted-foreground hover:text-foreground"
                      disabled={formState.isSubmitting}
                      onClick={() => {
                        form.setValue("note", "");
                        setShowNote(false);
                      }}
                    >
                      <Trans i18nKey="remove" defaults="Remove" />
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      className="w-full"
                      autoFocus={true}
                      disabled={formState.isSubmitting}
                      maxLength={MAX_RESPONSE_NOTE_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between gap-2">
                    <FormDescription>
                      <Trans
                        i18nKey="newParticipantFormNoteDescription"
                        defaults="Only the organizer will see this note."
                      />
                    </FormDescription>
                    <MaxCharLength
                      length={noteLength}
                      maxLength={MAX_RESPONSE_NOTE_LENGTH}
                      label={t("charactersRemaining", {
                        defaultValue:
                          "{count, plural, one {# character remaining} other {# characters remaining}}",
                        count: MAX_RESPONSE_NOTE_LENGTH - noteLength,
                      })}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <Button
              className="rounded-full"
              type="button"
              disabled={formState.isSubmitting}
              onClick={() => {
                setShowNote(true);
                posthog?.capture(
                  "new_participant_dialog:add_note_button_click",
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
              <PlusIcon data-icon="inline-start" />
              <Trans
                i18nKey="newParticipantFormAddNote"
                defaults="Add a note"
              />
            </Button>
          )}

          {formState.errors.root?.message ? (
            <FormMessage>{formState.errors.root.message}</FormMessage>
          ) : null}
        </form>
      </Form>
      <DialogFooter>
        <Button type="button" onClick={props.onCancel}>
          {t("back")}
        </Button>
        <Button
          type="submit"
          form="new-participant-form"
          variant="primary"
          loading={formState.isSubmitting}
        >
          <Trans
            i18nKey="newParticipantFormSubmit"
            defaults="Save availability"
          />
        </Button>
      </DialogFooter>
    </>
  );
};
