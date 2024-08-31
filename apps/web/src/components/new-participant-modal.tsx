import { zodResolver } from "@hookform/resolvers/zod";
import { VoteType } from "@rallly/database";
import { Badge } from "@rallly/ui/badge";
import { Button } from "@rallly/ui/button";
import { FormMessage } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import * as Sentry from "@sentry/nextjs";
import { TRPCClientError } from "@trpc/client";
import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { useMount } from "react-use";
import z from "zod";

import { usePoll } from "@/contexts/poll";

import { useAddParticipantMutation } from "./poll/mutations";
import VoteIcon from "./poll/vote-icon";

const requiredEmailSchema = z.object({
  requireEmail: z.literal(true),
  name: z.string().nonempty().max(100),
  email: z.string().email(),
});

const optionalEmailSchema = z.object({
  requireEmail: z.literal(false),
  name: z.string().nonempty().max(100),
  email: z.string().email().or(z.literal("")),
});

const schema = z.union([requiredEmailSchema, optionalEmailSchema]);

type NewParticipantFormData = z.infer<typeof schema>;

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
    <div
      className={clsx("flex flex-wrap gap-1.5 rounded border p-1.5", className)}
    >
      {voteTypes.map((voteType) => {
        const votes = voteByType[voteType];
        const count = votes.length;
        if (count === 0) {
          return null;
        }
        return (
          <div
            key={voteType}
            className="flex h-8 select-none gap-2.5 rounded-lg border bg-gray-50 p-1 text-sm"
          >
            <div className="flex items-center gap-2">
              <VoteIcon type={voteType} />
              <div className="text-muted-foreground">{t(voteType)}</div>
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

  const { register, setError, formState, setFocus, handleSubmit } =
    useForm<NewParticipantFormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        requireEmail: isEmailRequired,
      },
    });
  const addParticipant = useAddParticipantMutation();
  useMount(() => {
    setFocus("name");
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          const newParticipant = await addParticipant.mutateAsync({
            name: data.name,
            votes: props.votes,
            email: data.email,
            pollId: poll.id,
          });
          props.onSubmit?.(newParticipant);
        } catch (error) {
          if (error instanceof TRPCClientError) {
            setError("root", {
              message: error.message,
            });
          }
          Sentry.captureException(error);
        }
      })}
      className="space-y-4"
    >
      <fieldset>
        <label htmlFor="name" className="mb-1 text-gray-500">
          {t("name")}
        </label>
        <Input
          className="w-full"
          data-1p-ignore="true"
          error={!!formState.errors.name}
          disabled={formState.isSubmitting}
          placeholder={t("namePlaceholder")}
          {...register("name")}
        />
        {formState.errors.name?.message ? (
          <div className="mt-2 text-sm text-rose-500">
            {formState.errors.name.message}
          </div>
        ) : null}
      </fieldset>
      <fieldset>
        <label htmlFor="email" className="mb-1 text-gray-500">
          {t("email")}
          {!isEmailRequired ? ` (${t("optional")})` : null}
        </label>
        <Input
          className="w-full"
          error={!!formState.errors.email}
          disabled={formState.isSubmitting}
          placeholder={t("emailPlaceholder")}
          {...register("email")}
        />
        {formState.errors.email?.message ? (
          <div className="mt-1 text-sm text-rose-500">
            {formState.errors.email.message}
          </div>
        ) : null}
      </fieldset>
      <fieldset>
        <label className="mb-1 text-gray-500">{t("response")}</label>
        <VoteSummary votes={props.votes} />
      </fieldset>
      {formState.errors.root?.message ? (
        <FormMessage>{formState.errors.root.message}</FormMessage>
      ) : null}
      <div className="flex gap-2">
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
  );
};
