import { toast } from "@rallly/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import {
  addCommentAction,
  deleteCommentAction,
} from "@/features/poll/comment/actions";
import {
  addParticipantAction,
  deleteParticipantAction,
  renameParticipantAction,
  updateParticipantVotesAction,
} from "@/features/poll/participant/actions";
import { useTranslation } from "@/i18n/client";
import type { AppErrorCode } from "@/lib/errors/app-error";
import { trpc } from "@/trpc/client";
import type { ParticipantForm } from "./types";

export const normalizeVotes = (
  optionIds: string[],
  votes: ParticipantForm["votes"],
) => {
  return optionIds.map((optionId, i) => ({
    optionId,
    type: votes[i]?.type ?? ("no" as const),
  }));
};

/**
 * The token from an emailed link: a response's edit token, an invite token,
 * or a legacy seal. `invite` is the param older invite emails carry.
 */
export const useEditToken = () => {
  const searchParams = useSearchParams();
  return searchParams.get("token") ?? searchParams.get("invite") ?? undefined;
};

/**
 * Re-renders the page's server components and resolves once the new props
 * have landed, so a caller can hold its pending state until the list it
 * just changed shows the change. router.refresh() alone returns before
 * the round trip; the transition it runs in is what tracks completion.
 */
function useRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const resolvers = React.useRef<(() => void)[]>([]);

  React.useEffect(() => {
    if (!isPending) {
      const pending = resolvers.current;
      resolvers.current = [];
      for (const resolve of pending) {
        resolve();
      }
    }
  }, [isPending]);

  const refresh = React.useCallback(
    () =>
      new Promise<void>((resolve) => {
        resolvers.current.push(resolve);
        startTransition(() => {
          router.refresh();
        });
      }),
    [router],
  );

  return { refresh, isPending };
}

type ActionFailure = "tooManyRequests" | "unauthorized" | "unknown";

function toFailureReason(serverError: string | undefined): ActionFailure {
  switch (serverError as AppErrorCode | undefined) {
    case "TOO_MANY_REQUESTS":
      return "tooManyRequests";
    case "UNAUTHORIZED":
      return "unauthorized";
    default:
      return "unknown";
  }
}

type ActionResult<T> = {
  data?: T;
  serverError?: string;
  validationErrors?: unknown;
};

/**
 * Runs an action, then refreshes and waits for the new page props. Expected
 * failures come back as values from the action; transport and auth
 * failures are folded into the same shape so callers branch once.
 */
function useServerAction<TInput, TData extends { ok: boolean }>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
) {
  const { refresh, isPending: isRefreshing } = useRefresh();
  const [isExecuting, setIsExecuting] = React.useState(false);

  const execute = React.useCallback(
    async (
      input: TInput,
    ): Promise<TData | { ok: false; reason: ActionFailure }> => {
      setIsExecuting(true);
      try {
        const result = await action(input);
        if (!result.data) {
          return { ok: false, reason: toFailureReason(result.serverError) };
        }
        if (result.data.ok) {
          await refresh();
        }
        return result.data;
      } finally {
        setIsExecuting(false);
      }
    },
    [action, refresh],
  );

  return { execute, isPending: isExecuting || isRefreshing };
}

export const useAddParticipant = () => useServerAction(addParticipantAction);

export const useUpdateParticipantVotes = () =>
  useServerAction(updateParticipantVotesAction);

export const useRenameParticipant = () =>
  useServerAction(renameParticipantAction);

export const useDeleteParticipant = () =>
  useServerAction(deleteParticipantAction);

export const useAddComment = () => useServerAction(addCommentAction);

export const useDeleteComment = () => useServerAction(deleteCommentAction);

export const useUpdatePollMutation = () => {
  const { t } = useTranslation();
  const router = useRouter();
  return trpc.polls.modify.useMutation({
    onSuccess: (data) => {
      if (!data.ok) {
        toast.error(
          t("inappropriateContent", { defaultValue: "Inappropriate content" }),
          {
            action: {
              label: t("learnMore", { defaultValue: "Learn more" }),
              onClick: () => {
                window.open(
                  "https://support.rallly.co/guide/content-moderation",
                  "_blank",
                );
              },
            },
          },
        );
        return;
      }
      // The poll is served from the layout's server props; the edit pages
      // navigate back to it, so the refresh has to precede that navigation.
      router.refresh();
    },
  });
};
