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

export type BallotMode = "new" | "locked" | "edit";

type OwnResponse = Ballot["ownResponses"][number];

function initialMode(ballot: Ballot): BallotMode {
  return ballot.ownResponses.length > 0 ? "locked" : "new";
}

/**
 * The viewer's in-progress answers. Seeded from their saved response, and
 * reseeded when the server sends a different one (after a save or delete), but
 * not after a rename or when only other people's answers changed, so neither
 * wipes what the viewer is choosing.
 */
export function useBallotState({ ballot }: { ballot: Ballot }) {
  // Key order is not guaranteed by the read, so the signature sorts it:
  // the same saved response must never look like a new one.
  const ownSignature = JSON.stringify(
    ballot.ownResponses.map((response) => [
      response.id,
      Object.entries(response.votes).sort(([a], [b]) => a.localeCompare(b)),
    ]),
  );
  const [seededFrom, setSeededFrom] = React.useState(ownSignature);
  const [mode, setMode] = React.useState<BallotMode>(() => initialMode(ballot));
  const [activeResponseId, setActiveResponseIdState] = React.useState<
    string | null
  >(ballot.ownResponses[0]?.id ?? null);
  const [answers, setAnswers] = React.useState<Record<string, BallotVote>>(
    () => ballot.ownResponses[0]?.votes ?? {},
  );

  const findResponse = (id: string | null): OwnResponse | undefined =>
    ballot.ownResponses.find((response) => response.id === id);

  if (seededFrom !== ownSignature) {
    // Adjusting state while rendering, the React pattern for derived resets.
    const active =
      findResponse(activeResponseId) ?? ballot.ownResponses[0] ?? undefined;
    setSeededFrom(ownSignature);
    setActiveResponseIdState(active?.id ?? null);
    setAnswers(active?.votes ?? {});
    setMode(initialMode(ballot));
  }

  const canChange = ballot.canRespond && (mode === "new" || mode === "edit");

  return {
    mode,
    canChange,
    activeResponseId,
    answers,
    setActiveResponseId: (id: string) => {
      setActiveResponseIdState(id);
      setAnswers(findResponse(id)?.votes ?? {});
      setMode("locked");
    },
    setVote: (optionId: string, vote: BallotVote) => {
      if (!canChange) return;
      setAnswers((current) => ({ ...current, [optionId]: vote }));
    },
    /** Sets several answers at once; null clears an answer. */
    setVotes: (votes: Record<string, BallotVote | null>) => {
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
    startEditing: () => setMode("edit"),
    /** After a successful save: back to the thanks bar, keeping the answers. */
    markSaved: () => setMode("locked"),
    stopEditing: () => {
      setAnswers(findResponse(activeResponseId)?.votes ?? {});
      setMode("locked");
    },
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
 * The token from an emailed link: a response's edit token, an invite token,
 * or a legacy seal. `invite` is the param older invite emails carry.
 */
export function useLinkToken() {
  const searchParams = useSearchParams();
  return searchParams.get("token") ?? searchParams.get("invite") ?? undefined;
}

type ActionResult<T> = { data?: T; serverError?: string };
type Failure = { ok: false; reason: string };

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
      switch (result?.serverError) {
        case "TOO_MANY_REQUESTS":
          return { ok: false, reason: "tooManyRequests" };
        case "UNAUTHORIZED":
          return { ok: false, reason: "unauthorized" };
        default:
          return { ok: false, reason: "unknown" };
      }
    }
    return result.data;
  } catch {
    return { ok: false, reason: "unknown" };
  }
}

/** A session to attach the response to: the existing one, or a new guest. */
export async function ensureSession(): Promise<{ ok: true } | Failure> {
  try {
    const { data: existing } = await authClient.getSession();
    if (existing?.user) return { ok: true };
    const { error } = await authClient.signIn.anonymous();
    const result = toGuestSessionResult(error);
    if (!result.ok) return result;
    // A browser that blocks cookies drops Set-Cookie and still reports
    // success, so only reading the session back proves it.
    const { data: session } = await authClient.getSession();
    return session?.user
      ? { ok: true }
      : { ok: false, reason: "sessionUnavailable" };
  } catch {
    return { ok: false, reason: "sessionUnavailable" };
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
