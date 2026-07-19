import { zodResolver } from "@hookform/resolvers/zod";
import type { VoteType } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
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
import { Switch } from "@rallly/ui/switch";
import { TRPCClientError } from "@trpc/client";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { usePoll } from "@/features/poll/client";
import { useAddParticipantMutation } from "@/features/poll/components/mutations";
import VoteIcon from "@/features/poll/components/vote-icon";
import { useUser } from "@/features/user/components/user-provider";
import { Trans, useTranslation } from "@/i18n/client";
import { isSelfHosted } from "@/lib/constants";
import { useDateTimeConfig } from "@/lib/datetime/client";

const requiredEmailSchema = z.object({
  requireEmail: z.literal(true),
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  useGravatar: z.boolean(),
});

const optionalEmailSchema = z.object({
  requireEmail: z.literal(false),
  name: z.string().trim().min(1).max(100),
  email: z.email().or(z.literal("")),
  useGravatar: z.boolean(),
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
      useGravatar: true,
      ...(isLoggedIn
        ? { name: user.name, email: user.email ?? "" }
        : {
            name: "",
            email: "",
          }),
    },
  });

  const { setError, formState, handleSubmit } = form;
  const emailValue = form.watch("email");
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
              timeZone,
              useGravatar: data.useGravatar,
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
              {!isSelfHosted && emailValue ? (
                <FormDescription>
                  <Trans
                    i18nKey="participantEmailGravatarHint"
                    defaults="If you have a <a>Gravatar</a> account, your email may be used to show your profile picture. Turn this off below to keep your avatar private."
                    components={{
                      a: (
                        <a
                          className="text-link"
                          href="https://gravatar.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  />
                </FormDescription>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        {!isSelfHosted && emailValue ? (
          <FormField
            control={form.control}
            name="useGravatar"
            render={({ field }) => (
              <FormItem>
                {/* biome-ignore lint/a11y/noLabelWithoutControl: switch is rendered inside */}
                <label className="flex cursor-pointer select-none items-start gap-x-3 rounded-xl border bg-card p-3 hover:bg-card-accent">
                  <div className="grow">
                    <div className="font-medium text-sm">
                      <Trans
                        i18nKey="participantUseGravatarLabel"
                        defaults="Show my Gravatar profile picture"
                      />
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      <Trans
                        i18nKey="participantUseGravatarDescription"
                        defaults="When enabled, a hash of your email is sent to Gravatar (Automattic) to look up an avatar."
                      />
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                </label>
              </FormItem>
            )}
          />
        ) : null}

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
