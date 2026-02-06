import { zodResolver } from "@hookform/resolvers/zod";
import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { usePoll } from "@/contexts/poll";
import { useTranslation } from "@/i18n/client";
import { useTimezone } from "@/lib/timezone/client/context";
import { useAddParticipantMutation } from "./poll/mutations";
import VoteIcon from "./poll/vote-icon";
import { useUser } from "./user-provider";

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
  const { timezone } = useTimezone();
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

  return (
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
              timeZone: timezone,
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
  );
};
