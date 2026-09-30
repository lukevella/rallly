"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent } from "@rallly/ui/dialog";
import { toast } from "@rallly/ui/sonner";
import * as React from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import * as z from "zod";
import {
  normalizeVotes,
  useEditToken,
  useUpdateParticipantVotes,
} from "@/features/poll/components/mutations";
import { NewParticipantForm } from "@/features/poll/components/new-participant-modal";
import type { VoteType } from "@/features/poll/constants";
import { getVoteTypes } from "@/features/poll/constants";
import type { VotePageView, VoteResult } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";

const schema = z.object({
  mode: z.enum(["new", "edit", "view"]),
  votes: z.array(
    z
      .object({
        optionId: z.string(),
        type: z.enum(["yes", "no", "ifNeedBe"]).optional(),
      })
      .optional(),
  ),
});

type VoteFormValues = z.infer<typeof schema>;

export const useVoteForm = () => useFormContext<VoteFormValues>();

/**
 * Writes one option's vote. Separate from `useVote` so a view that handles
 * clicks above its cells can set a vote without subscribing to one option.
 *
 * `type` may be a function of the current vote, so a caller that cycles does
 * not have to close over the votes: a stale closure would freeze the cycle
 * after one step.
 */
export function useSetVote() {
  const form = useVoteForm();

  return React.useCallback(
    (
      optionId: string,
      type: VoteType | ((current: VoteType | undefined) => VoteType),
    ) => {
      const next = [...form.getValues("votes")];
      const at = next.findIndex((vote) => vote?.optionId === optionId);
      const resolved =
        typeof type === "function"
          ? type(at === -1 ? undefined : next[at]?.type)
          : type;
      const entry = { optionId, type: resolved };
      if (at === -1) {
        next.push(entry);
      } else {
        next[at] = entry;
      }
      form.setValue("votes", next, { shouldDirty: true });
    },
    [form],
  );
}

/**
 * Read and write one option's vote. Every view goes through this, so the
 * selection survives switching between them and no view needs to know how
 * the votes array is laid out.
 */
export function useVote(optionId: string) {
  const form = useVoteForm();
  const votes = form.watch("votes");
  const mode = form.watch("mode");
  const index = votes.findIndex((vote) => vote?.optionId === optionId);
  const set = useSetVote();

  const setVote = React.useCallback(
    (type: VoteType) => set(optionId, type),
    [set, optionId],
  );

  return {
    value: index === -1 ? undefined : votes[index]?.type,
    setVote,
    /** True while the viewer is composing, false when reviewing a saved one. */
    isEditing: mode !== "view",
  };
}

/**
 * Every option's current vote, for views that style all their cells at once
 * rather than one at a time. Returns the saved response once it is no longer
 * being edited, so a view shows what is stored rather than a stale draft.
 */
export function useVotesByOption(savedVotes: Map<string, VoteType>) {
  const form = useVoteForm();
  const votes = form.watch("votes");
  const mode = form.watch("mode");
  const isEditing = mode !== "view";

  const byOption = React.useMemo(() => {
    if (!isEditing) {
      return savedVotes;
    }
    const map = new Map<string, VoteType>();
    for (const vote of votes) {
      if (vote?.optionId && vote.type) {
        map.set(vote.optionId, vote.type);
      }
    }
    return map;
  }, [votes, isEditing, savedVotes]);

  return { byOption, isEditing };
}

/**
 * An option's tally with the viewer's pending vote folded in, so the bar
 * moves as they vote. The server score already counts their saved vote, so
 * that one is taken back out first; a new response has none to remove.
 *
 * Returns null when the poll hides scores, matching the stored score.
 */
export function useLiveScore({
  optionId,
  score,
  savedVote,
  participantCount,
  hasSavedResponse,
}: {
  score: VoteResult["score"];
  optionId: string;
  /** The viewer's stored vote on this option, already inside `score`. */
  savedVote: VoteType | undefined;
  participantCount: number | null;
  /** Whether the viewer already counts towards `participantCount`. */
  hasSavedResponse: boolean;
}) {
  const { value, isEditing } = useVote(optionId);

  if (score === null || participantCount === null) {
    return null;
  }
  if (!isEditing) {
    return { score, participantCount };
  }

  const next = { ...score };
  if (savedVote === "yes") {
    next.yes -= 1;
  } else if (savedVote === "ifNeedBe") {
    next.ifNeedBe -= 1;
  }
  if (value === "yes") {
    next.yes += 1;
  } else if (value === "ifNeedBe") {
    next.ifNeedBe += 1;
  }

  // A response in progress is not in the denominator yet. It counts once
  // for the whole poll, not once per option with a vote on it.
  return {
    score: next,
    participantCount: hasSavedResponse
      ? participantCount
      : participantCount + 1,
  };
}

/**
 * The next vote in the cycle, for views where one control advances through
 * the types rather than offering all of them at once. The order is the
 * shared display order, so a cycling cell and the list's control agree.
 */
export function nextVoteType(
  current: VoteType | undefined,
  allowTentativeVotes: boolean,
): VoteType {
  const types = getVoteTypes(allowTentativeVotes);
  const at = current ? types.indexOf(current) : -1;
  return types[(at + 1) % types.length];
}

/**
 * A new response starts as a no on every option, which is what an
 * untouched form submits anyway; showing it makes that explicit.
 */
const emptyVotes = (results: VotePageView["results"]) =>
  results.map((result) => ({
    optionId: result.optionId,
    type: "no" as const,
  }));

/**
 * Owns the response being composed. Writes go through a server action and
 * the page then re-renders from the loader, so nothing is patched here.
 */
export function VoteForm({
  pollId,
  requireParticipantEmail,
  results,
  response,
  canVote,
  children,
}: {
  pollId: string;
  requireParticipantEmail: boolean;
  results: VotePageView["results"];
  response: VotePageView["response"];
  canVote: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const updateVotes = useUpdateParticipantVotes();
  const token = useEditToken();
  const [isNewParticipantOpen, setIsNewParticipantOpen] = React.useState(false);

  const optionIds = results.map((result) => result.optionId);
  const mode: VoteFormValues["mode"] = canVote && !response ? "new" : "view";
  const form = useForm<VoteFormValues>({
    defaultValues: { mode, votes: emptyVotes(results) },
    resolver: zodResolver(schema),
  });

  // The page re-renders from the loader after every write, so the form
  // follows the response appearing or disappearing: deleting one puts the
  // viewer straight back into composing a new response. Only the response
  // identity is a dependency; `results` and `mode` are recomputed on every
  // server render and would fire this on any refresh.
  const responseId = response?.participantId ?? null;
  const lastResponseId = React.useRef(responseId);
  const latest = React.useRef<{
    mode: VoteFormValues["mode"];
    results: VotePageView["results"];
  }>({ mode, results });
  latest.current = { mode, results };
  React.useEffect(() => {
    if (lastResponseId.current === responseId) {
      return;
    }
    lastResponseId.current = responseId;
    form.reset({
      mode: latest.current.mode,
      votes: emptyVotes(latest.current.results),
    });
  }, [responseId, form]);

  return (
    <FormProvider {...form}>
      <form
        id="vote-form"
        onSubmit={form.handleSubmit(async (data) => {
          if (!response) {
            setIsNewParticipantOpen(true);
            return;
          }

          const result = await updateVotes.execute({
            participantId: response.participantId,
            votes: normalizeVotes(optionIds, data.votes),
            token,
          });

          if (!result.ok) {
            // Stay in edit mode so the selection is not lost.
            toast.error(
              result.reason === "closed"
                ? t("pollClosedDescription", {
                    defaultValue: "No more responses are being accepted.",
                  })
                : t("actionErrorInternalServerError", {
                    defaultValue: "An internal server error occurred",
                  }),
            );
            return;
          }

          form.reset({ mode: "view", votes: emptyVotes(results) });
        })}
      />
      <Dialog
        open={isNewParticipantOpen}
        onOpenChange={setIsNewParticipantOpen}
      >
        <DialogContent size="sm">
          <NewParticipantForm
            pollId={pollId}
            requireParticipantEmail={requireParticipantEmail}
            votes={normalizeVotes(optionIds, form.watch("votes"))}
            onSubmit={() => {
              form.reset({ mode: "view", votes: emptyVotes(results) });
            }}
            onCancel={() => setIsNewParticipantOpen(false)}
          />
        </DialogContent>
      </Dialog>
      {children}
    </FormProvider>
  );
}
