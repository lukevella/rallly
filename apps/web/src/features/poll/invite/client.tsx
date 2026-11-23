"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";
import { toGuestSessionResult } from "@/features/user/utils";
import { useTranslation } from "@/i18n/client";
import { authClient } from "@/lib/auth-client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import type { Ballot, BallotVote } from "./types";
import { isOptionPast } from "./utils";

/** `saved` once the viewer has a response; its answers stay open to change. */
export type BallotMode = "new" | "saved";

type OwnResponse = Ballot["ownResponses"][number];

function initialMode(ballot: Ballot): BallotMode {
  return ballot.ownResponses.length > 0 ? "saved" : "new";
}

/**
 * The viewer's in-progress answers. Seeded from their saved response, and
 * reseeded when the server sends a different one (after a save or delete), but
 * not after a rename or when only other people's answers changed, so neither
 * wipes what the viewer is choosing.
 */
export function useBallotState({ ballot }: { ballot: Ballot }) {
  // Key order is not guaranteed by the read, so the signature sorts it:
  // the same saved response must never look like a new one. Every page render
  // from the server sends a new array, so the memo never hides a change.
  const ownSignature = React.useMemo(
    () =>
      JSON.stringify(
        ballot.ownResponses.map((response) => [
          response.id,
          Object.entries(response.votes).sort(([a], [b]) => a.localeCompare(b)),
        ]),
      ),
    [ballot.ownResponses],
  );
  const [seededFrom, setSeededFrom] = React.useState(ownSignature);
  const [mode, setMode] = React.useState<BallotMode>(() => initialMode(ballot));
  const [activeResponseId, setActiveResponseIdState] = React.useState<
    string | null
  >(ballot.ownResponses[0]?.id ?? null);
  const [answers, setAnswers] = React.useState<Record<string, BallotVote>>(
    () => ballot.ownResponses[0]?.votes ?? {},
  );
  // What the server last accepted. Held here so a save reads as saved at once,
  // without waiting for the page to come back with it.
  const [savedAnswers, setSavedAnswers] = React.useState<
    Record<string, BallotVote>
  >(() => ballot.ownResponses[0]?.votes ?? {});

  const findResponse = (id: string | null): OwnResponse | undefined =>
    ballot.ownResponses.find((response) => response.id === id);

  if (seededFrom !== ownSignature) {
    // Adjusting state while rendering, the React pattern for derived resets.
    const active =
      findResponse(activeResponseId) ?? ballot.ownResponses[0] ?? undefined;
    setSeededFrom(ownSignature);
    setActiveResponseIdState(active?.id ?? null);
    setAnswers(active?.votes ?? {});
    setSavedAnswers(active?.votes ?? {});
    setMode(initialMode(ballot));
  }

  const canChange = ballot.canRespond;
  // Stable, so memoized rows can take them.
  const setVote = React.useCallback(
    (optionId: string, vote: BallotVote) => {
      if (!canChange) return;
      setAnswers((current) => ({ ...current, [optionId]: vote }));
    },
    [canChange],
  );
  /** Sets several answers at once; null clears an answer. */
  const setVotes = React.useCallback(
    (votes: Record<string, BallotVote | null>) => {
      if (!canChange) return;
      setAnswers((current) => {
        const next = { ...current };
        for (const [optionId, vote] of Object.entries(votes)) {
          if (vote) {
            next[optionId] = vote;
          } else {
            delete next[optionId];
          }
        }
        return next;
      });
    },
    [canChange],
  );
  // An unanswered option is saved as no, so the two compare as equal.
  const hasChanges =
    mode === "saved" &&
    ballot.options.some(
      (option) =>
        (answers[option.id] ?? "no") !== (savedAnswers[option.id] ?? "no"),
    );

  return {
    mode,
    canChange,
    hasChanges,
    activeResponseId,
    answers,
    setActiveResponseId: (id: string) => {
      const votes = findResponse(id)?.votes ?? {};
      setActiveResponseIdState(id);
      setAnswers(votes);
      setSavedAnswers(votes);
    },
    setVote,
    setVotes,
    /** After a successful save: what is chosen is now what is saved. */
    markSaved: () => setSavedAnswers(answers),
    discardChanges: () => setAnswers(savedAnswers),
  };
}

export type BallotState = ReturnType<typeof useBallotState>;

/**
 * Which options have passed, by the viewer's clock, and whether they are
 * showing. `ready` is false until the page is in the browser and has a clock.
 */
export function usePastOptions({ ballot }: { ballot: Ballot }) {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => setNow(new Date()), []);
  const [show, setShow] = React.useState(false);
  const { timeZone } = useDateTimeConfig();
  const viewerTimeZone = timeZone ?? getBrowserTimeZone();

  const ids = new Set(
    now
      ? ballot.options
          .filter((option) =>
            isOptionPast({
              startTime: option.startTime,
              isDatePoll: ballot.isDatePoll,
              isFloating: !ballot.timeZone,
              now,
              viewerTimeZone,
            }),
          )
          .map((option) => option.id)
      : [],
  );

  return {
    ready: now !== null,
    ids,
    show,
    toggle: () => setShow((value) => !value),
  };
}

export type PastOptions = ReturnType<typeof usePastOptions>;

/**
 * When the viewer last changed the time zone or format, so the times that
 * moved can flash. A ref, so marking a change renders nothing more.
 */
export function useTimesChangedAt(displayKey: string) {
  const changedAt = React.useRef(Number.NEGATIVE_INFINITY);
  const previous = React.useRef(displayKey);
  // A layout effect, so it is set before the times' own effects read it.
  React.useLayoutEffect(() => {
    if (previous.current === displayKey) return;
    previous.current = displayKey;
    changedAt.current = performance.now();
  }, [displayKey]);
  return changedAt;
}

/**
 * The token from an emailed link: a response's edit token, an invite token,
 * or a legacy seal. `invite` is the param older invite emails carry.
 */
export function useLinkToken() {
  const searchParams = useSearchParams();
  return searchParams.get("token") ?? searchParams.get("invite") ?? undefined;
}

type ActionResult<T> = {
  data?: T;
  serverError?: string;
  validationErrors?: unknown;
};

/**
 * What lay behind a failure, for analytics only. The reason picks the message
 * the viewer reads; several causes share one reason.
 */
export type FailureDetail = {
  cause: string;
  server_error?: string;
  error_name?: string;
  error_message?: string;
  status?: number;
};
type Failure = { ok: false; reason: string; detail?: FailureDetail };

const thrownDetail = (cause: string, error: unknown): FailureDetail => ({
  cause,
  error_name: error instanceof Error ? error.name : typeof error,
  error_message: String(error instanceof Error ? error.message : error).slice(
    0,
    200,
  ),
});

/**
 * Runs a server action and folds transport and auth failures into the same
 * `{ ok: false, reason }` shape the actions return for expected refusals.
 */
export async function runBallotAction<T extends { ok: boolean }>(
  run: () => Promise<ActionResult<T> | undefined>,
): Promise<T | Failure> {
  try {
    const result = await run();
    if (!result?.data) {
      const detail: FailureDetail = result?.serverError
        ? { cause: "server_error", server_error: result.serverError }
        : result?.validationErrors
          ? { cause: "validation_error" }
          : { cause: result ? "no_data" : "no_result" };
      switch (result?.serverError) {
        case "TOO_MANY_REQUESTS":
          return { ok: false, reason: "tooManyRequests", detail };
        case "UNAUTHORIZED":
          return { ok: false, reason: "unauthorized", detail };
        default:
          return { ok: false, reason: "unknown", detail };
      }
    }
    return result.data;
  } catch (error) {
    return {
      ok: false,
      reason: "unknown",
      detail: thrownDetail("action_threw", error),
    };
  }
}

/** A session to attach the response to: the existing one, or a new guest. */
export async function ensureSession(): Promise<{ ok: true } | Failure> {
  let step = "get_session";
  try {
    const { data: existing } = await authClient.getSession();
    if (existing?.user) return { ok: true };
    step = "sign_in";
    const { error } = await authClient.signIn.anonymous();
    const result = toGuestSessionResult(error);
    if (!result.ok) {
      return {
        ...result,
        detail: {
          cause: "sign_in_error",
          status: error?.status,
          server_error: error?.code,
        },
      };
    }
    // A browser that blocks cookies drops Set-Cookie and still reports
    // success, so only reading the session back proves it.
    step = "read_back";
    const { data: session, error: readBackError } =
      await authClient.getSession();
    if (session?.user) return { ok: true };
    return {
      ok: false,
      reason: "sessionUnavailable",
      detail: readBackError
        ? {
            cause: "read_back_error",
            status: readBackError.status,
            server_error: readBackError.code,
          }
        : { cause: "no_session_after_sign_in" },
    };
  } catch (error) {
    return {
      ok: false,
      reason: "sessionUnavailable",
      detail: thrownDetail(`${step}_threw`, error),
    };
  }
}

/** The message for a refused write, in the viewer's language. */
export function useBallotErrorMessage() {
  const { t } = useTranslation();
  return (reason: string) => {
    switch (reason) {
      case "full":
      case "closed":
      case "notFound":
        return t("newParticipantFormErrorPollFull", {
          defaultValue: "This poll is no longer accepting responses.",
        });
      case "tentativeVotesNotAllowed":
        return t("ballotErrorTentativeNotAllowed", {
          defaultValue:
            "The organizer has turned off if need be. Change those answers and try again.",
        });
      case "tooManyRequests":
        return t("newParticipantFormErrorTooManyRequests", {
          defaultValue:
            "You have made too many attempts. Please wait a while and try again.",
        });
      case "unauthorized":
        return t("newParticipantFormErrorUnauthorized", {
          defaultValue:
            "We couldn't verify your session. Please refresh the page and try again.",
        });
      case "sessionUnavailable":
        return t("guestSessionUnavailableError", {
          defaultValue:
            "We couldn't start a session for you. Check that cookies are enabled and try again.",
        });
      default:
        return t("newParticipantFormSubmitError", {
          defaultValue:
            "Your response could not be saved. Please check your connection and try again.",
        });
    }
  };
}
