"use client";

import { posthog } from "@rallly/posthog/client";
import { buttonVariants, cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@rallly/ui/dropdown-menu";
import { Field, FieldLabel } from "@rallly/ui/field";
import { Input } from "@rallly/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { SuccessCheck, SuccessCheckIcon } from "@rallly/ui/success-check";
import { Textarea } from "@rallly/ui/textarea";
import {
  ClockIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserRoundPenIcon,
} from "lucide-react";
import * as React from "react";
import { Link } from "@/components/link";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { Spinner } from "@/components/spinner";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { PollConferencingSummary } from "@/features/conferencing/components/poll-conferencing-summary";
import TruncatedLinkify from "@/features/poll/components/truncated-linkify";
import VoteIcon from "@/features/poll/components/vote-icon";
import {
  ensureSession,
  runBallotAction,
  useBallotErrorMessage,
  useBallotState,
  useLinkToken,
  usePastOptions,
} from "@/features/poll/invite/client";
import { BallotBarOption } from "@/features/poll/invite/components/ballot-bar-option";
import { BallotCount } from "@/features/poll/invite/components/ballot-count";
import {
  ballotBarButtonClassName,
  ballotToggleClassName,
} from "@/features/poll/invite/components/ballot-pill";
import { BallotResponseOptions } from "@/features/poll/invite/components/ballot-response-options";
import { PastTimesToggle } from "@/features/poll/invite/components/past-times-toggle";
import type { Ballot, BallotVote } from "@/features/poll/invite/types";
import {
  availableCount,
  groupBallotOptions,
  nextVote,
} from "@/features/poll/invite/utils";
import {
  addParticipantAction,
  deleteParticipantAction,
  renameParticipantAction,
  updateParticipantVotesAction,
} from "@/features/poll/participant/actions";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";
import type { PollDetails } from "@/features/poll/types";
import { TimeFormatSwitcher } from "@/features/poll/vote/components/time-format-switcher";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import {
  formatDateTime,
  formatDateTimeRange,
  formatDuration,
} from "@/lib/datetime/format";
import { getBrowserTimeZone } from "@/lib/utils/date-time-utils";
import { TimeZonePicker } from "./time-zone-picker";
import { VoteSummary } from "./vote-summary";

/** The hover for the rows a mouse can cycle. */
const rowHoverClassName: Record<BallotVote | "none", string> = {
  none: "[@media(pointer:fine)]:hover:border-gray-400 dark:[@media(pointer:fine)]:hover:border-gray-500",
  no: "[@media(pointer:fine)]:hover:border-gray-400 dark:[@media(pointer:fine)]:hover:border-gray-500",
  yes: "[@media(pointer:fine)]:hover:border-green-600 dark:[@media(pointer:fine)]:hover:border-green-400",
  ifNeedBe:
    "[@media(pointer:fine)]:hover:border-amber-600 dark:[@media(pointer:fine)]:hover:border-amber-400",
};

const factIconClassName =
  "mt-[calc((1lh-1rem)/2)] size-4 shrink-0 text-muted-foreground";

/** Kept in the tree and at a real position, so direct activation still lands. */
const radiosWhenMouseClassName =
  "[@media(pointer:fine)]:group-not-has-[input:focus-visible]:absolute [@media(pointer:fine)]:group-not-has-[input:focus-visible]:right-0 [@media(pointer:fine)]:group-not-has-[input:focus-visible]:bottom-0 [@media(pointer:fine)]:group-not-has-[input:focus-visible]:gap-0 [@media(pointer:fine)]:group-not-has-[input:focus-visible]:opacity-0";
const radioWhenMouseClassName =
  "[@media(pointer:fine)]:group-not-has-[input:focus-visible]:size-px [@media(pointer:fine)]:group-not-has-[input:focus-visible]:overflow-hidden";

type FieldError = { field: "name" | "email" | "votes"; message: string };

/**
 * The voting form built for screen readers first: native controls in document
 * order, headings to navigate by, one fieldset per option that names its full
 * date and time, and no visual-only state. Nothing is hidden behind a dialog or
 * a second step, so the whole task can be read and answered in one pass.
 */
export function AccessibleBallot({
  poll,
  ballot,
  description,
  lockup,
  showCreatePollPrompt,
}: {
  poll: PollDetails;
  ballot: Ballot;
  /** The space and title, in place of the title on its own. */
  lockup: React.ReactNode;
  /** An invitation to make a poll, where the page still credits Rallly. */
  showCreatePollPrompt: boolean;
  description: React.ReactNode;
}) {
  const { t } = useTranslation();
  const token = useLinkToken();
  const errorMessage = useBallotErrorMessage();
  const state = useBallotState({ ballot });
  const past = usePastOptions({ ballot });
  const { locale, timeZone: viewerTimeZone, timeFormat } = useDateTimeConfig();

  const [errors, setErrors] = React.useState<FieldError[]>([]);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [showNote, setShowNote] = React.useState(false);
  const noteRemoved = React.useRef(false);

  // The button that was pressed is gone, so focus goes back to the one that
  // replaced it.
  React.useEffect(() => {
    if (!showNote && noteRemoved.current) {
      noteRemoved.current = false;
      document.getElementById("add-note")?.focus();
    }
  }, [showNote]);
  const [status, setStatus] = React.useState("");
  const deleteDialog = useDialog();
  const detailsDialog = useDialog();
  const [savingDetails, setSavingDetails] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const formMessageRef = React.useRef<HTMLParagraphElement>(null);
  const formHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  // The thanks is only for the moment a first response is saved. A later visit,
  // a refresh or a saved edit goes to the answers under the response bar.
  const [justSaved, setJustSaved] = React.useState(false);
  const previousMode = React.useRef(state.mode);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [sidebarScrolls, setSidebarScrolls] = React.useState(false);

  React.useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!past.ready || !sidebar) return;
    const update = () =>
      setSidebarScrolls(sidebar.scrollHeight > sidebar.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, [past.ready]);
  const answersRef = React.useRef<HTMLDivElement>(null);
  const [answersScroll, setAnswersScroll] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: what is listed changes the content, which the observer on the panel itself can't see
  React.useEffect(() => {
    const answers = answersRef.current;
    if (!past.ready || !answers) return;
    const update = () =>
      setAnswersScroll(answers.scrollHeight > answers.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(answers);
    return () => observer.disconnect();
  }, [past.ready, past.show, state.mode]);
  const detailsHeadingRef = React.useRef<HTMLHeadingElement>(null);
  // A new response answers the options first, then says who it is from.
  const [onDetailsStep, setOnDetailsStep] = React.useState(false);
  // The whole form moves, card included: forward, answers leave up and details
  // arrive from below; back is the reverse.
  const [stepExit, setStepExit] = React.useState<"forward" | "back" | null>(
    null,
  );
  const [cameBack, setCameBack] = React.useState(false);
  const finishStepExit = React.useCallback((direction: "forward" | "back") => {
    setStepExit(null);
    setCameBack(direction === "back");
    setOnDetailsStep(direction === "forward");
  }, []);
  // In case the exit never runs, the step must still move on.
  React.useEffect(() => {
    if (!stepExit) return;
    const timeout = setTimeout(() => finishStepExit(stepExit), 400);
    return () => clearTimeout(timeout);
  }, [stepExit, finishStepExit]);
  // transition-none because a duration alone would also transition the box's
  // size as the step changes.
  const stepMotion = stepExit
    ? cn(
        "fade-out animate-out fill-mode-forwards transition-none duration-200 ease-out-ui",
        stepExit === "forward"
          ? "motion-safe:slide-out-to-top-6"
          : "motion-safe:slide-out-to-bottom-6",
      )
    : onDetailsStep
      ? "fade-in motion-safe:slide-in-from-bottom-6 animate-in transition-none duration-300 ease-out-ui"
      : cameBack
        ? "fade-in motion-safe:slide-in-from-top-6 animate-in transition-none duration-300 ease-out-ui"
        : undefined;
  const previousStep = React.useRef(onDetailsStep);
  if (onDetailsStep && state.mode !== "new") {
    setOnDetailsStep(false);
  }

  // Each step replaces the other, so focus moves to where the step starts.
  React.useEffect(() => {
    if (previousStep.current === onDetailsStep) return;
    previousStep.current = onDetailsStep;
    window.scrollTo(0, 0);
    document.querySelector("[data-invite-answers]")?.scrollTo(0, 0);
    if (onDetailsStep) {
      // On a touch screen the field would open the keyboard over the page.
      const target = window.matchMedia("(pointer: fine)").matches
        ? document.getElementById("name")
        : detailsHeadingRef.current;
      target?.focus();
    } else if (state.mode === "new") formHeadingRef.current?.focus();
  }, [onDetailsStep, state.mode]);

  // Moving between answering and the saved result replaces the content the
  // reader is on, so focus goes to the heading that names the new content.
  React.useEffect(() => {
    if (previousMode.current === state.mode) return;
    previousMode.current = state.mode;
    // Without scrolling: pressing Edit partway down a long poll leaves it in place.
    const target =
      state.mode === "locked"
        ? (resultHeadingRef.current ?? editButtonRef.current)
        : formHeadingRef.current;
    target?.focus({ preventScroll: true });
  }, [state.mode]);

  const backToAvailability = () => {
    if (stepExit) return;
    setErrors([]);
    setSaveError(null);
    setStepExit("back");
  };

  const hasZone = Boolean(ballot.timeZone) && !ballot.isDatePoll;
  const displayTimeZone =
    ballot.isDatePoll || !ballot.timeZone
      ? "UTC"
      : (viewerTimeZone ?? getBrowserTimeZone());

  const date = (iso: string, preset: "dateFull" | "weekdayMonthDay") =>
    formatDateTime(new Date(iso), {
      preset,
      locale,
      timeFormat,
      timeZone: displayTimeZone,
    });
  const time = (value: Date) =>
    formatDateTime(value, {
      preset: "time",
      locale,
      timeFormat,
      timeZone: displayTimeZone,
    });

  /** Written out in words: readers skip or mangle the en dash in a range. */
  // With one length for every option the sidebar says it once, so each option
  // needs only its start. A saved response still lists full ranges, as the record of it.
  const firstDuration = ballot.options[0]?.duration ?? 0;
  const sharedDuration =
    !ballot.isDatePoll &&
    firstDuration > 0 &&
    ballot.options.every((option) => option.duration === firstDuration)
      ? firstDuration
      : null;
  const votingLabel = (option: Ballot["options"][number]) =>
    sharedDuration
      ? t("screenReaderOptionStartLabel", {
          defaultValue: "{date}, {start}",
          date: date(option.startTime, "dateFull"),
          start: time(new Date(option.startTime)),
        })
      : optionLabel(option);

  const optionLabel = (option: Ballot["options"][number]) => {
    const start = new Date(option.startTime);
    if (ballot.isDatePoll || option.duration === 0) {
      return date(option.startTime, "dateFull");
    }
    return t("screenReaderOptionLabel", {
      defaultValue: "{date}, {start} to {end}",
      date: date(option.startTime, "dateFull"),
      start: time(start),
      end: time(new Date(start.getTime() + option.duration * 60_000)),
    });
  };

  const answerLabels: Record<BallotVote, string> = {
    yes: t("yes", { defaultValue: "Yes" }),
    ifNeedBe: t("ifNeedBe", { defaultValue: "If need be" }),
    no: t("no", { defaultValue: "No" }),
  };
  const answerChoices: BallotVote[] = ballot.allowTentativeVotes
    ? ["yes", "ifNeedBe", "no"]
    : ["yes", "no"];

  const votable = ballot.options.filter((option) => !past.ids.has(option.id));
  const answeredCount = votable.filter(
    (option) => state.answers[option.id],
  ).length;
  const active = ballot.ownResponses.find(
    (response) => response.id === state.activeResponseId,
  );
  const isNew = state.mode === "new";
  const hasResponded = state.mode === "locked" && ballot.canRespond && active;
  const showThanks = hasResponded && justSaved ? hasResponded : null;
  const compactOnPhone = onDetailsStep || Boolean(showThanks);
  const hasChanges =
    state.mode === "edit" &&
    ballot.options.some(
      (option) =>
        (state.answers[option.id] ?? "no") !==
        (active?.votes[option.id] ?? "no"),
    );
  const noChangesToSave = state.mode === "edit" && !hasChanges;
  const hasUnsavedAnswers = isNew ? answeredCount > 0 : hasChanges;
  React.useEffect(() => {
    if (!hasUnsavedAnswers) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedAnswers]);

  const answersBeforeShortcut = React.useRef<Record<string, BallotVote> | null>(
    null,
  );
  const allMarked = (vote: BallotVote) =>
    votable.length > 0 &&
    votable.every((option) => state.answers[option.id] === vote);

  // Turning a shortcut off puts back whatever it replaced, so pressing one by
  // mistake costs nothing. Switching between them keeps the original answers.
  const markAll = (vote: "yes" | "no") => {
    if (pending) return;
    if (allMarked(vote)) {
      const before = answersBeforeShortcut.current;
      state.setVotes(
        Object.fromEntries(
          votable.map((option) => [option.id, before?.[option.id] ?? null]),
        ),
      );
      answersBeforeShortcut.current = null;
      setStatus(
        t("screenReaderAnswersRestored", {
          defaultValue: "Your earlier answers are back",
        }),
      );
      return;
    }
    if (!allMarked(vote === "yes" ? "no" : "yes")) {
      answersBeforeShortcut.current = state.answers;
    }
    state.setVotes(
      Object.fromEntries(votable.map((option) => [option.id, vote])),
    );
    setStatus(
      t("screenReaderMarkedAll", {
        defaultValue:
          "{count, plural, one {# option set to {answer}} other {All # options set to {answer}}}",
        count: votable.length,
        answer: answerLabels[vote],
      }),
    );
  };

  const fail = (nextErrors: FieldError[], nextSaveError: string | null) => {
    setErrors(nextErrors);
    setSaveError(nextSaveError);
    // After the errors have rendered. A field's error is read out as its
    // description; one with no field gets focus on the message itself.
    const first = nextErrors[0]?.field;
    requestAnimationFrame(() => {
      const target =
        first === "name" || first === "email"
          ? document.getElementById(first)
          : formMessageRef.current;
      target?.focus();
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || stepExit || noChangesToSave) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors: FieldError[] = [];

    if (answeredCount === 0) {
      nextErrors.push({
        field: "votes",
        message: t("screenReaderErrorNoAnswers", {
          defaultValue: "Answer at least one option.",
        }),
      });
    }
    if (isNew && !onDetailsStep) {
      if (nextErrors.length > 0) {
        fail(nextErrors, null);
        return;
      }
      setErrors([]);
      setSaveError(null);
      setStepExit("forward");
      // Same name and properties as the old page, so the two compare.
      posthog?.capture("poll_response:form_open", {
        poll_id: ballot.pollId,
        require_email: ballot.requireParticipantEmail,
        tier: poll.space?.tier,
      });
      return;
    }
    if (isNew) {
      if (!String(data.get("name") ?? "").trim()) {
        nextErrors.push({
          field: "name",
          message: t("screenReaderErrorName", {
            defaultValue: "Enter your name.",
          }),
        });
      }
      const email = form.elements.namedItem("email") as HTMLInputElement;
      if (ballot.requireParticipantEmail && !email.value.trim()) {
        nextErrors.push({
          field: "email",
          message: t("screenReaderErrorEmailMissing", {
            defaultValue: "Enter your email address.",
          }),
        });
      } else if (!email.validity.valid) {
        nextErrors.push({
          field: "email",
          message: t("screenReaderErrorEmailInvalid", {
            defaultValue:
              "Enter an email address in the format name@example.com.",
          }),
        });
      }
    }
    if (nextErrors.length > 0) {
      fail(nextErrors, null);
      return;
    }

    const votes = ballot.options.map((option) => ({
      optionId: option.id,
      type: state.answers[option.id] ?? ("no" as const),
    }));

    setPending(true);
    setErrors([]);
    setSaveError(null);
    // So what this save announces reads as new, even with the same words.
    setStatus("");
    let result: { ok: true } | { ok: false; reason: string };
    if (isNew) {
      const session = await ensureSession();
      result = session.ok
        ? await runBallotAction(() =>
            addParticipantAction({
              pollId: ballot.pollId,
              name: String(data.get("name") ?? ""),
              email: String(data.get("email") ?? ""),
              note: String(data.get("note") ?? ""),
              timeZone: ballot.timeZone
                ? (viewerTimeZone ?? undefined)
                : undefined,
              token,
              votes,
            }),
          )
        : session;
    } else {
      const participantId = state.activeResponseId;
      result = participantId
        ? await runBallotAction(() =>
            updateParticipantVotesAction({ participantId, votes, token }),
          )
        : { ok: false, reason: "unknown" };
      if (result.ok) state.markSaved();
    }
    setPending(false);
    if (!result.ok) {
      fail([], errorMessage(result.reason));
      return;
    }
    if (isNew) {
      setJustSaved(true);
      // poll_response_submit is captured on the server under the guest's user
      // id, so it can't be joined to the browser's $pageview.
      posthog?.capture("poll_response:form_submit", {
        poll_id: ballot.pollId,
        tier: poll.space?.tier,
      });
    }
    setStatus(
      t("screenReaderAnswersSaved", {
        defaultValue: "Your answers are saved",
      }),
    );
  };

  const errorFor = (field: FieldError["field"]) =>
    errors.find((error) => error.field === field);

  const groups = past.ready
    ? groupBallotOptions({
        // With nothing left to attend, the past times are all there is to show.
        options: past.show || votable.length === 0 ? ballot.options : votable,
        isDatePoll: ballot.isDatePoll,
        timeZone: displayTimeZone,
      })
    : [];
  const optionsById = new Map(ballot.options.map((o) => [o.id, o]));

  const countDescription = (optionId: string, liveVote?: BallotVote) => {
    if (!ballot.tallies) return null;
    const count = availableCount({
      entries: ballot.tallies[optionId] ?? [],
      activeResponseId: state.activeResponseId,
      liveVote,
    });
    return t("screenReaderOptionCount", {
      defaultValue:
        "{count, plural, =0 {No one has said they can make this yet} one {# person can make this} other {# people can make this}}",
      count,
    });
  };

  /** What a row shows on screen; the day heading above it carries the date. */
  const rowTimeLabel = (option: Ballot["options"][number]) => {
    if (ballot.isDatePoll || option.duration === 0) {
      return date(option.startTime, "weekdayMonthDay");
    }
    const start = new Date(option.startTime);
    return sharedDuration
      ? time(start)
      : formatDateTimeRange(
          start,
          new Date(start.getTime() + option.duration * 60_000),
          {
            preset: "time",
            locale,
            timeFormat,
            timeZone: displayTimeZone,
          },
        );
  };

  const dayHeading = (
    first: Ballot["options"][number] | undefined,
    key: string,
  ) =>
    !first
      ? key
      : ballot.isDatePoll
        ? formatDateTime(new Date(first.startTime), {
            preset: "monthYear",
            locale,
            timeFormat,
            timeZone: displayTimeZone,
          })
        : date(first.startTime, "weekdayMonthDay");

  const total =
    ballot.responseCount + (state.canChange && !state.activeResponseId ? 1 : 0);

  // Outside the voting form: React events cross portals, so the form in here
  // would submit that one too.
  const responseDialogs = active ? (
    <>
      <Dialog {...detailsDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="screenReaderChangeName" defaults="Change name" />
            </DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const name = String(
                new FormData(event.currentTarget).get("name") ?? "",
              );
              setSavingDetails(true);
              setDetailsError(null);
              const result = await runBallotAction(() =>
                renameParticipantAction({
                  participantId: active.id,
                  name,
                  token,
                }),
              );
              setSavingDetails(false);
              if (!result.ok) {
                setDetailsError(errorMessage(result.reason ?? ""));
                return;
              }
              detailsDialog.dismiss();
              setStatus(
                t("screenReaderNameUpdated", {
                  defaultValue: "Your name was updated",
                }),
              );
            }}
          >
            <Field>
              <FieldLabel htmlFor="details-name">
                <Trans i18nKey="name" defaults="Name" />
              </FieldLabel>
              <Input
                id="details-name"
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                defaultValue={active.name}
              />
            </Field>
            {detailsError ? (
              <p
                role="alert"
                className="text-rose-700 text-sm dark:text-rose-400"
              >
                {detailsError}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" onClick={detailsDialog.dismiss}>
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
              <Button type="submit" variant="primary" loading={savingDetails}>
                <Trans i18nKey="save" defaults="Save" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog {...deleteDialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans
                i18nKey="screenReaderDeleteAnswersTitle"
                defaults="Delete your answers?"
              />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="screenReaderDeleteAnswersDescription"
                defaults="The organizer will no longer see them. This cannot be undone."
              />
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p
              role="alert"
              className="text-rose-700 text-sm dark:text-rose-400"
            >
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button onClick={deleteDialog.dismiss}>
              <Trans i18nKey="cancel" defaults="Cancel" />
            </Button>
            <Button
              variant="destructive"
              className="text-white dark:bg-rose-600 dark:hover:bg-rose-700"
              loading={deleting}
              onClick={async () => {
                setDeleting(true);
                setDeleteError(null);
                const result = await runBallotAction(() =>
                  deleteParticipantAction({
                    participantId: active.id,
                    token,
                  }),
                );
                setDeleting(false);
                if (!result.ok) {
                  setDeleteError(errorMessage(result.reason ?? ""));
                  return;
                }
                deleteDialog.dismiss();
                setStatus(
                  t("screenReaderAnswersDeleted", {
                    defaultValue: "Your answers were deleted",
                  }),
                );
              }}
            >
              <Trans i18nKey="delete" defaults="Delete" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

  // On the sidebar with the answers, and on the card with the details step.
  const eventFacts = (
    <>
      {poll.location ? (
        <div className="order-2">
          <dt className="sr-only">
            <Trans i18nKey="eventHeaderLocation" defaults="Location" />
          </dt>
          <dd className="flex items-start gap-2">
            <MapPinIcon aria-hidden="true" className={factIconClassName} />
            <span className="min-w-0">
              <TruncatedLinkify>{poll.location}</TruncatedLinkify>
            </span>
          </dd>
        </div>
      ) : null}
      {ballot.options[0] &&
      ballot.options.every(
        (option) =>
          option.duration > 0 &&
          option.duration === ballot.options[0]?.duration,
      ) ? (
        <div className="order-1">
          <dt className="sr-only">
            <Trans i18nKey="eventHeaderDuration" defaults="Duration" />
          </dt>
          <dd className="flex items-start gap-2">
            <ClockIcon aria-hidden="true" className={factIconClassName} />
            <span className="min-w-0">
              {formatDuration(ballot.options[0].duration, locale)}
            </span>
          </dd>
        </div>
      ) : null}
      {poll.conferencing ? (
        <div className="order-3">
          <dt className="sr-only">
            <Trans i18nKey="eventHeaderVideoCall" defaults="Video call" />
          </dt>
          <dd className="flex items-center gap-2">
            <PollConferencingSummary
              conferencing={poll.conferencing}
              meetingUri={poll.event?.conferencingUri}
            />
          </dd>
        </div>
      ) : null}
    </>
  );

  const timeZoneNote =
    hasZone && viewerTimeZone ? (
      <p className="text-muted-foreground text-sm">
        <Trans
          i18nKey="screenReaderTimesShownIn"
          defaults="Times shown in <picker>{city} time</picker>"
          values={{
            city: getCityFromTimezoneId(viewerTimeZone),
          }}
          components={{
            picker: (
              <TimeZonePicker
                className="text-foreground"
                triggerLabel={t("screenReaderChangeTimeZone", {
                  defaultValue: "{city} time. Change time zone",
                  city: getCityFromTimezoneId(viewerTimeZone),
                })}
                onChange={(id) =>
                  setStatus(
                    t("screenReaderTimeZoneChanged", {
                      defaultValue: "Times are now shown in {city} time",
                      city: getCityFromTimezoneId(id),
                    }),
                  )
                }
              />
            ),
          }}
        />
      </p>
    ) : null;
  const timeFormatSwitcher = ballot.isDatePoll ? null : (
    <TimeFormatSwitcher
      pill
      onChange={(format) =>
        setStatus(
          format === "hours12"
            ? t("screenReaderTimeFormat12", {
                defaultValue: "Times are now shown in 12-hour format",
              })
            : t("screenReaderTimeFormat24", {
                defaultValue: "Times are now shown in 24-hour format",
              }),
        )
      }
    />
  );

  const startEditing = () => {
    setJustSaved(false);
    state.startEditing();
    setStatus(
      t("screenReaderEditingResponse", {
        defaultValue: "Editing your response",
      }),
    );
  };
  const saveChangesButton = (
    <Button
      type="submit"
      form="ballot-form"
      variant="primary"
      className={cn(
        "rounded-xl",
        noChangesToSave && "cursor-not-allowed opacity-50",
      )}
      aria-disabled={pending || noChangesToSave || undefined}
      aria-describedby={noChangesToSave ? "no-changes" : undefined}
    >
      {pending ? (
        <Trans i18nKey="screenReaderSaving" defaults="Saving" />
      ) : (
        <Trans i18nKey="screenReaderSaveChanges" defaults="Save changes" />
      )}
    </Button>
  );

  return (
    <>
      {/* Above the columns, so it stays put while either of them scrolls. Editing
          only changes what is inside it, so nothing on the page moves. */}
      {active && ballot.canRespond && !showThanks ? (
        <section
          data-invite-responded
          aria-label={t("response", { defaultValue: "Response" })}
          className="sticky top-0 z-30 flex h-13 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 text-sm lg:static lg:px-6 dark:bg-muted"
        >
          {state.mode === "edit" ? (
            <>
              {saveError || (errorFor("votes") && answeredCount === 0) ? (
                <p
                  ref={formMessageRef}
                  tabIndex={-1}
                  className="min-w-0 truncate text-rose-700 outline-none dark:text-rose-400"
                >
                  {saveError ?? errorFor("votes")?.message}
                </p>
              ) : (
                <p className="min-w-0 truncate">
                  <span className="max-sm:hidden">
                    <Trans
                      i18nKey="screenReaderEditingResponse"
                      defaults="Editing your response"
                    />
                  </span>
                  <span className="sm:hidden">
                    <Trans i18nKey="responseBarEditing" defaults="Editing" />
                  </span>
                </p>
              )}
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setErrors([]);
                    setSaveError(null);
                    state.stopEditing();
                  }}
                >
                  <Trans i18nKey="cancel" defaults="Cancel" />
                </Button>
                {saveChangesButton}
              </div>
              {noChangesToSave ? (
                <p id="no-changes" className="sr-only">
                  <Trans
                    i18nKey="screenReaderNoChanges"
                    defaults="No changes to save"
                  />
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="flex shrink-0">
                  <OptimizedAvatarImage size="sm" name={active.name} />
                </span>
                <p className="min-w-0 truncate">
                  <Trans
                    i18nKey="screenReaderAlreadyResponded"
                    defaults="You've already responded as {name}"
                    values={{ name: active.name }}
                  />
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        aria-label={t("moreOptions", {
                          defaultValue: "More options",
                        })}
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setDetailsError(null);
                        detailsDialog.trigger();
                      }}
                    >
                      <UserRoundPenIcon />
                      <Trans
                        i18nKey="screenReaderChangeName"
                        defaults="Change name"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setDeleteError(null);
                        deleteDialog.trigger();
                      }}
                    >
                      <TrashIcon />
                      <Trans
                        i18nKey="screenReaderDeleteResponse"
                        defaults="Delete response"
                      />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  ref={editButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label={t("screenReaderEditResponse", {
                    defaultValue: "Edit response",
                  })}
                  onClick={startEditing}
                >
                  <PencilIcon />
                </Button>
              </div>
            </>
          )}
        </section>
      ) : null}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex w-full flex-1 flex-col gap-y-8 px-4 pt-4 lg:grid lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:px-0 lg:pt-0",
          // The card takes this width: the full one for the answers, and only what
          // the form or the thanks need after that.
          compactOnPhone
            ? "lg:w-auto lg:grid-cols-[20rem_36rem] xl:grid-cols-[24rem_36rem]"
            : "lg:w-[calc(100vw-2rem)] lg:max-w-6xl lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]",
          compactOnPhone && "max-lg:gap-y-4",
        )}
      >
        <div
          ref={sidebarRef}
          // A panel that scrolls has to be reachable from the keyboard.
          {...(sidebarScrolls
            ? {
                tabIndex: 0,
                role: "group",
                "aria-label": t("screenReaderDetailsHeading", {
                  defaultValue: "Poll details",
                }),
              }
            : {})}
          className={cn(
            "flex flex-col gap-6 focus-visible:outline-2 focus-visible:outline-ring lg:relative lg:min-h-0 lg:overflow-y-auto lg:p-6",
            // Below lg the rest would push the card or the thanks below the fold, so
            // only the branding stays there. From lg all of it stays beside every step.
            !lockup && compactOnPhone && "max-lg:hidden",
            !lockup && stepMotion,
            "lg:animate-none",
          )}
        >
          <div>
            {lockup ?? (
              <h1 className="text-balance font-semibold text-xl tracking-tight max-lg:hidden">
                {poll.title}
              </h1>
            )}
            <div className={cn(compactOnPhone && "max-lg:hidden")}>
              {description}
            </div>
          </div>

          <div className={cn("text-sm", compactOnPhone && "max-lg:hidden")}>
            <h2 className="sr-only">
              <Trans
                i18nKey="screenReaderDetailsHeading"
                defaults="Poll details"
              />
            </h2>
            {/* Read in document order; `order` only arranges them on screen. */}
            <dl className="flex flex-col gap-2.5">
              {poll.user ? (
                <div className="order-last mt-2.5">
                  <dt className="text-muted-foreground">
                    <Trans
                      i18nKey="eventHeaderOrganizer"
                      defaults="Organizer"
                    />
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span aria-hidden="true" className="flex shrink-0">
                      <OptimizedAvatarImage
                        size="sm"
                        src={poll.user.image ?? undefined}
                        name={poll.user.name}
                      />
                    </span>
                    <span className="min-w-0 truncate">{poll.user.name}</span>
                  </dd>
                </div>
              ) : null}
              {eventFacts}
            </dl>
          </div>

          {/* A visual key for the icon-only answers; the radios name themselves. */}
          <div
            aria-hidden="true"
            className={cn(compactOnPhone && "max-lg:hidden")}
          >
            <BallotResponseOptions
              allowTentativeVotes={ballot.allowTentativeVotes}
            />
          </div>
        </div>

        {/* Level with the top of the sidebar. Beside a title on its own, the extra
          pixel lines up their baselines. */}
        <div
          ref={answersRef}
          data-invite-answers
          // Results may have nothing to tab to, and not every browser lets the
          // keyboard scroll a panel without a stop of its own.
          {...(answersScroll && !state.canChange
            ? {
                tabIndex: 0,
                role: "group",
                "aria-label": t("voteResultsPanelLabel", {
                  defaultValue: "Results",
                }),
              }
            : {})}
          className={cn(
            "mx-auto flex w-full min-w-0 flex-col focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-2 lg:relative lg:min-h-0 lg:overflow-y-auto lg:px-8",
            "lg:col-start-2 lg:border-l",
            showThanks && "max-lg:flex-1",
            showThanks
              ? undefined
              : compactOnPhone || lockup
                ? "lg:pt-6"
                : "lg:pt-[calc(1.5rem+1px)]",
          )}
        >
          {/* Always in the page, so readers register it before it has anything to say. */}
          <output className="sr-only">{status}</output>

          {/* The times depend on the viewer's clock and zone, so they wait for the
              browser. The room they will take stops the card jumping when they land. */}
          {!past.ready ? (
            <output
              className="flex justify-center pt-8"
              style={{ minHeight: `${ballot.options.length * 3.5 + 4}rem` }}
            >
              <Spinner />
              <span className="sr-only">
                <Trans
                  i18nKey="screenReaderLoading"
                  defaults="Loading the options"
                />
              </span>
            </output>
          ) : showThanks ? (
            <section
              aria-labelledby="thanks-heading"
              className="flex flex-1 flex-col items-center justify-center py-8 text-center"
            >
              <SuccessCheck state="in">
                <SuccessCheckIcon className="size-14" />
              </SuccessCheck>
              <h2
                id="thanks-heading"
                ref={resultHeadingRef}
                tabIndex={-1}
                className="mt-6 text-balance font-semibold text-xl tracking-tight outline-none"
              >
                <Trans
                  i18nKey="screenReaderThanksHeading"
                  defaults="Thanks, {name}"
                  values={{ name: showThanks.name }}
                />
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                <Trans
                  i18nKey="newParticipantDialogSuccessDescription"
                  defaults="The organizer can now see your availability."
                />
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={startEditing}
                >
                  <Trans
                    i18nKey="screenReaderEditResponse"
                    defaults="Edit response"
                  />
                </Button>
              </div>
              {showCreatePollPrompt ? (
                <div className="mt-8 flex flex-col items-center">
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
                        "invite_confirmation:create_poll_link_click",
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
              ) : null}
            </section>
          ) : !state.canChange ? (
            <section aria-labelledby="result-heading" className="flex flex-col">
              <div className="flex items-center justify-between gap-x-4">
                <h2
                  id="result-heading"
                  tabIndex={-1}
                  className="min-w-0 font-semibold text-lg tracking-tight outline-none"
                >
                  {hasResponded ? (
                    <Trans
                      i18nKey="screenReaderFormHeading"
                      defaults="When can you make it?"
                    />
                  ) : active ? (
                    <Trans
                      i18nKey="screenReaderSavedHeading"
                      defaults="{name}, your answers are saved"
                      values={{ name: active.name }}
                    />
                  ) : poll.status === "scheduled" ? (
                    <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />
                  ) : (
                    <Trans
                      i18nKey="pollClosedDescription"
                      defaults="No more responses are being accepted."
                    />
                  )}
                </h2>
                {timeFormatSwitcher ? (
                  <div className="-my-1 shrink-0">{timeFormatSwitcher}</div>
                ) : null}
              </div>
              {poll.status === "scheduled" && poll.event ? (
                <p className="mt-2 flex flex-wrap gap-x-2 font-medium text-sm">
                  <EventDate
                    value={poll.event.start}
                    allDay={poll.event.duration === 0}
                    timeZone={poll.timeZone}
                    preset="dateFull"
                  />
                  <EventTimeRange
                    start={poll.event.start}
                    end={
                      new Date(
                        poll.event.start.getTime() +
                          poll.event.duration * 60_000,
                      )
                    }
                    allDay={poll.event.duration === 0}
                    timeZone={poll.timeZone}
                    showTimeZone
                  />
                </p>
              ) : null}
              {ballot.isDatePoll || !timeZoneNote ? null : (
                <div className="mt-3">{timeZoneNote}</div>
              )}
              {past.ids.size > 0 && votable.length > 0 ? (
                <p className="mt-3 flex flex-wrap gap-2">
                  <PastTimesToggle
                    past={past}
                    labelled={true}
                    className="rounded-xl"
                  />
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-4">
                {groups.map((group) => {
                  const first = optionsById.get(group.optionIds[0] ?? "");
                  return (
                    <section key={group.key} className="flex flex-col gap-1.5">
                      <h3 className="font-medium text-sm">
                        {dayHeading(first, group.key)}
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {group.optionIds.map((optionId) => {
                          const option = optionsById.get(optionId);
                          if (!option) return null;
                          const vote = state.answers[optionId];
                          return (
                            <BallotBarOption
                              key={optionId}
                              label={rowTimeLabel(option)}
                              fullLabel={optionLabel(option)}
                              vote={vote}
                              canVote={false}
                              compact={true}
                              isPast={false}
                              onCycle={() => {}}
                              count={
                                ballot.tallies
                                  ? availableCount({
                                      entries: ballot.tallies[optionId] ?? [],
                                      activeResponseId: state.activeResponseId,
                                      liveVote: vote,
                                    })
                                  : undefined
                              }
                              total={total}
                            />
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
              {/* The same room below the options as editing leaves, so the page keeps its height. */}
              {hasResponded ? <div aria-hidden="true" className="h-6" /> : null}
            </section>
          ) : (
            <form
              id="ballot-form"
              noValidate
              onSubmit={submit}
              onAnimationEnd={(event) => {
                if (stepExit && event.target === event.currentTarget) {
                  finishStepExit(stepExit);
                }
              }}
              aria-labelledby={
                onDetailsStep ? "details-heading" : "form-heading"
              }
              className={cn(
                "flex flex-col",
                stepMotion,
                onDetailsStep && "mx-auto mb-6 w-full max-w-lg",
              )}
            >
              {onDetailsStep ? (
                <div className="mb-6 border-b pb-6 text-sm has-[dl:empty]:hidden lg:hidden">
                  <dl className="flex flex-col gap-2.5 empty:hidden">
                    {eventFacts}
                  </dl>
                </div>
              ) : null}
              {/* Kept mounted but hidden, so going back loses nothing either way. */}
              <div
                hidden={onDetailsStep}
                className={onDetailsStep ? "hidden" : "flex flex-col"}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h2
                    id="form-heading"
                    ref={formHeadingRef}
                    tabIndex={-1}
                    className="min-w-0 font-semibold text-lg tracking-tight outline-none"
                  >
                    {isNew ? (
                      <span className="sr-only">
                        <Trans
                          i18nKey="screenReaderStep"
                          defaults="Step {step} of 2: "
                          values={{ step: 1 }}
                        />
                      </span>
                    ) : null}
                    <Trans
                      i18nKey="screenReaderFormHeading"
                      defaults="When can you make it?"
                    />
                  </h2>
                  {/* Taller than the heading, without moving it off the title's baseline. */}
                  {timeFormatSwitcher ? (
                    <div className="-my-1 shrink-0">{timeFormatSwitcher}</div>
                  ) : null}
                </div>
                {ballot.isDatePoll || !timeZoneNote ? null : (
                  <div className="mt-3">{timeZoneNote}</div>
                )}
                <p id="availability" className="sr-only">
                  <Trans
                    i18nKey="screenReaderInstructions"
                    defaults="{count, plural, one {There is # option.} other {There are # options.}} Each one is a group of answers, with the date and time as its name. Anything you leave unanswered is saved as no."
                    values={{ count: votable.length }}
                  />
                </p>
                {(isNew && votable.length > 1) || past.ids.size > 0 ? (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {isNew && votable.length > 1 ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          className={cn(ballotToggleClassName, "rounded-xl")}
                          aria-pressed={allMarked("yes")}
                          onClick={() => markAll("yes")}
                        >
                          <Trans
                            i18nKey="screenReaderMarkAllYes"
                            defaults="Answer yes to every option"
                          />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className={cn(ballotToggleClassName, "rounded-xl")}
                          aria-pressed={allMarked("no")}
                          onClick={() => markAll("no")}
                        >
                          <Trans
                            i18nKey="screenReaderMarkAllNo"
                            defaults="Answer no to every option"
                          />
                        </Button>
                      </>
                    ) : null}
                    {past.ids.size > 0 ? (
                      <PastTimesToggle
                        past={past}
                        labelled={true}
                        className="rounded-xl"
                      />
                    ) : null}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col gap-4">
                  {groups.map((group) => {
                    const first = optionsById.get(group.optionIds[0] ?? "");
                    return (
                      <section
                        key={group.key}
                        className="flex flex-col gap-1.5"
                      >
                        <h3 className="font-medium text-sm">
                          {dayHeading(first, group.key)}
                        </h3>
                        {group.optionIds.map((optionId) => {
                          const option = optionsById.get(optionId);
                          if (!option) return null;
                          const vote = state.answers[optionId];
                          const count = countDescription(optionId, vote);
                          const countId = `count-${optionId}`;
                          // Past times cannot be attended, so they only show here.
                          const isPast = past.ids.has(optionId);
                          const liveCount = ballot.tallies
                            ? availableCount({
                                entries: ballot.tallies[optionId] ?? [],
                                activeResponseId: state.activeResponseId,
                                liveVote: vote,
                              })
                            : null;
                          return (
                            // biome-ignore lint/a11y/useKeyWithClickEvents: a mouse shortcut; the radios inside are the keyboard path
                            <fieldset
                              key={optionId}
                              aria-describedby={count ? countId : undefined}
                              disabled={isPast}
                              onClick={(event) => {
                                // Mouse only, and never for the radios themselves:
                                // assistive technology activates those directly.
                                if (
                                  isPast ||
                                  pending ||
                                  !window.matchMedia("(pointer: fine)")
                                    .matches ||
                                  (event.target as Element).closest("label")
                                ) {
                                  return;
                                }
                                state.setVote(
                                  optionId,
                                  nextVote(vote, ballot.allowTentativeVotes),
                                );
                              }}
                              className={cn(
                                "group relative isolate flex min-h-12.5 min-w-0 flex-wrap items-center gap-x-3 gap-y-2 overflow-hidden rounded-xl border bg-card py-1.5 pr-1.5 pl-3 [@media(pointer:fine)]:pr-3.5 lg:[@media(pointer:fine)]:min-h-10 lg:[@media(pointer:fine)]:py-0",
                                isPast
                                  ? "opacity-60"
                                  : [
                                      "[@media(pointer:fine)]:cursor-pointer",
                                      rowHoverClassName[vote ?? "none"],
                                    ],
                                vote === "yes" &&
                                  "border-green-400 dark:border-green-500/60",
                                vote === "ifNeedBe" &&
                                  "border-amber-400 dark:border-amber-500/60",
                              )}
                            >
                              {/* The full date for readers; the day heading above carries it on screen. */}
                              <legend className="sr-only">
                                {isPast
                                  ? t("screenReaderPastOption", {
                                      defaultValue: "{option} (already passed)",
                                      option: votingLabel(option),
                                    })
                                  : votingLabel(option)}
                              </legend>
                              {liveCount !== null && total > 0 ? (
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "absolute inset-y-0 left-0 -z-10 transition-[width,background-color] duration-200 motion-reduce:transition-none",
                                    vote === "yes"
                                      ? "bg-green-100 dark:bg-green-500/25"
                                      : vote === "ifNeedBe"
                                        ? "bg-amber-100 dark:bg-amber-500/25"
                                        : "bg-gray-200 dark:bg-white/10",
                                  )}
                                  style={{
                                    width: `${Math.round((liveCount / total) * 100)}%`,
                                  }}
                                />
                              ) : null}
                              {/* With a mouse the row shows one mark, as the answer it cycles. */}
                              <span
                                aria-hidden="true"
                                className="hidden [@media(pointer:fine)]:flex [@media(pointer:fine)]:shrink-0"
                              >
                                {vote ? (
                                  <VoteIcon
                                    round
                                    type={vote}
                                    className="lg:size-4"
                                  />
                                ) : (
                                  <span className="size-5 rounded-full border border-gray-500 border-dashed lg:size-4 dark:border-gray-400" />
                                )}
                              </span>
                              <span
                                aria-hidden="true"
                                className="flex min-h-9 min-w-0 flex-1 items-center text-sm tabular-nums lg:[@media(pointer:fine)]:min-h-9.5"
                              >
                                {rowTimeLabel(option)}
                              </span>
                              {liveCount !== null ? (
                                <span
                                  aria-hidden="true"
                                  className="[&_[data-testid=ballot-tally]]:text-foreground"
                                >
                                  <BallotCount value={liveCount} />
                                </span>
                              ) : null}
                              {count ? (
                                <p id={countId} className="sr-only">
                                  {count}
                                </p>
                              ) : null}
                              {/* The real radio covers its icon, so touch exploration finds it
    there. With a mouse they shrink away until the keyboard reaches them. */}
                              <div
                                className={cn(
                                  "flex gap-x-3 gap-y-2",
                                  radiosWhenMouseClassName,
                                )}
                              >
                                {answerChoices.map((choice) => (
                                  <label
                                    key={choice}
                                    className={cn(
                                      "relative block",
                                      radioWhenMouseClassName,
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer scroll-mt-16 scroll-mb-24 opacity-0"
                                      name={`vote-${optionId}`}
                                      value={choice}
                                      checked={vote === choice}
                                      onChange={() => {
                                        // What is being saved is what stays, so
                                        // answers hold still until it lands.
                                        if (pending) {
                                          setStatus(
                                            t("voteSaveInProgress", {
                                              defaultValue:
                                                "Your answers are still saving. Try again when that finishes.",
                                            }),
                                          );
                                        } else {
                                          state.setVote(optionId, choice);
                                        }
                                      }}
                                    />
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        "flex size-9 items-center justify-center rounded-full border border-gray-500 bg-background outline-ring outline-offset-2 peer-checked:border-2 peer-focus-visible:outline-2 dark:border-gray-400 [&_svg]:brightness-75 [&_svg]:grayscale peer-checked:[&_svg]:brightness-100 peer-checked:[&_svg]:grayscale-0 lg:[@media(pointer:fine)]:size-6",
                                        choice === "yes" &&
                                          "peer-checked:border-green-600",
                                        choice === "ifNeedBe" &&
                                          "peer-checked:border-amber-500",
                                        choice === "no" &&
                                          "peer-checked:border-gray-600",
                                      )}
                                    >
                                      <VoteIcon
                                        round
                                        type={choice}
                                        className="size-5 lg:[@media(pointer:fine)]:size-4"
                                      />
                                    </span>
                                    <span className="sr-only">
                                      {answerLabels[choice]}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          );
                        })}
                      </section>
                    );
                  })}
                </div>
                {state.mode === "edit" && active ? (
                  <div className="pb-6">
                    {/* Save sits before the options in the bar, so whoever tabbed down
                      through them gets one here too. */}
                    <Button
                      type="submit"
                      variant="primary"
                      className="sr-only not-focus-visible:h-px rounded-xl focus-visible:not-sr-only focus-visible:mt-6"
                    >
                      <Trans
                        i18nKey="screenReaderSaveChanges"
                        defaults="Save changes"
                      />
                    </Button>
                  </div>
                ) : null}
              </div>

              {isNew ? (
                <section
                  aria-labelledby="details-heading"
                  hidden={!onDetailsStep}
                  className={cn(
                    "flex-col gap-4 text-sm",
                    onDetailsStep ? "flex" : "hidden",
                  )}
                >
                  <h2
                    id="details-heading"
                    ref={detailsHeadingRef}
                    tabIndex={-1}
                    className="scroll-mt-20 font-semibold text-lg tracking-tight outline-none"
                  >
                    <span className="sr-only">
                      <Trans
                        i18nKey="screenReaderStep"
                        defaults="Step {step} of 2: "
                        values={{ step: 2 }}
                      />
                    </span>
                    <Trans i18nKey="whoAreYou" defaults="Who are you?" />
                  </h2>
                  <p className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="font-medium">
                      <Trans i18nKey="name" defaults="Name" />
                    </label>
                    <Input
                      id="name"
                      name="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      className="scroll-mt-6"
                      aria-invalid={errorFor("name") ? true : undefined}
                      // Focus can land here, past the heading, so it names the step too.
                      aria-describedby={
                        errorFor("name")
                          ? "details-heading name-error"
                          : "details-heading"
                      }
                    />
                    {errorFor("name") ? (
                      <span
                        id="name-error"
                        className="text-rose-700 dark:text-rose-400"
                      >
                        {errorFor("name")?.message}
                      </span>
                    ) : null}
                  </p>
                  <p className="flex flex-col gap-1.5">
                    <span className="flex items-center justify-between gap-2">
                      <label htmlFor="email" className="font-medium">
                        <Trans i18nKey="email" defaults="Email" />
                        {ballot.requireParticipantEmail ? null : (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            <Trans i18nKey="optional" defaults="(optional)" />
                          </span>
                        )}
                      </label>
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          className="h-6 rounded-sm text-muted-foreground text-sm underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                          aria-label={t("newParticipantFormEmailWhyLabel", {
                            defaultValue: "Why we ask for your email",
                          })}
                        >
                          <Trans
                            i18nKey="newParticipantFormEmailWhy"
                            defaults="Why?"
                          />
                        </PopoverTrigger>
                        <PopoverContent align="end">
                          <Trans
                            i18nKey="newParticipantFormEmailDescription"
                            defaults="We'll email you a link to change your response, and the organizer can let you know the final time."
                          />
                        </PopoverContent>
                      </Popover>
                    </span>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required={ballot.requireParticipantEmail}
                      autoComplete="email"
                      className="scroll-mt-6"
                      aria-invalid={errorFor("email") ? true : undefined}
                      aria-describedby={
                        errorFor("email")
                          ? "email-error email-help"
                          : "email-help"
                      }
                    />
                    {errorFor("email") ? (
                      <span
                        id="email-error"
                        className="text-rose-700 dark:text-rose-400"
                      >
                        {errorFor("email")?.message}
                      </span>
                    ) : null}
                    {/* Still the field's description, so a screen reader hears it on arrival. */}
                    <span id="email-help" className="sr-only">
                      <Trans
                        i18nKey="newParticipantFormEmailDescription"
                        defaults="We'll email you a link to change your response, and the organizer can let you know the final time."
                      />
                    </span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">
                        <Trans i18nKey="response" defaults="Response" />
                      </h3>
                      <button
                        type="button"
                        className="h-6 rounded-sm text-muted-foreground text-sm underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        aria-label={t("screenReaderChangeResponse", {
                          defaultValue: "Change your response",
                        })}
                        onClick={backToAvailability}
                      >
                        <Trans i18nKey="change" defaults="Change" />
                      </button>
                    </div>
                    <VoteSummary
                      votes={votable.map(
                        (option) => state.answers[option.id] ?? "no",
                      )}
                    />
                  </div>
                  {showNote ? (
                    <p className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2">
                        <label htmlFor="note" className="font-medium">
                          <Trans i18nKey="note" defaults="Note" />
                        </label>
                        <button
                          type="button"
                          className="h-6 rounded-sm text-muted-foreground text-sm underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                          onClick={() => {
                            setShowNote(false);
                            noteRemoved.current = true;
                          }}
                        >
                          <Trans
                            i18nKey="screenReaderRemoveNote"
                            defaults="Remove note"
                          />
                        </button>
                      </span>
                      <Textarea
                        id="note"
                        aria-describedby="note-help"
                        autoFocus
                        name="note"
                        className="bg-background/80 dark:bg-foreground/5"
                        maxLength={MAX_RESPONSE_NOTE_LENGTH}
                      />
                      <span id="note-help" className="text-muted-foreground">
                        <Trans
                          i18nKey="screenReaderNoteHint"
                          defaults="Only the organizer will see this"
                        />
                      </span>
                    </p>
                  ) : (
                    <Button
                      id="add-note"
                      type="button"
                      className="self-start rounded-xl"
                      onClick={() => setShowNote(true)}
                    >
                      <PlusIcon aria-hidden="true" data-icon="inline-start" />
                      <Trans
                        i18nKey="newParticipantFormAddNote"
                        defaults="Add a note"
                      />
                    </Button>
                  )}
                </section>
              ) : null}

              {isNew && votable.length === 0 ? (
                <p className="py-6 text-muted-foreground text-sm">
                  <Trans
                    i18nKey="voteAllOptionsPassed"
                    defaults="All of these times have passed, so there is nothing left to answer. Contact the organizer if you still want to respond."
                  />
                </p>
              ) : isNew ? (
                <div
                  className={cn(
                    "flex flex-col gap-2",
                    onDetailsStep
                      ? "pt-6"
                      : "sticky bottom-0 z-20 bg-linear-to-t from-85% from-gray-50 to-transparent pt-8 pb-4 lg:from-card dark:from-gray-900 dark:lg:from-card",
                  )}
                >
                  {/* Next to the button that raised it, for what has no field of its own. */}
                  {saveError || (errorFor("votes") && answeredCount === 0) ? (
                    <p
                      ref={formMessageRef}
                      tabIndex={-1}
                      className="text-rose-700 text-sm outline-none dark:text-rose-400"
                    >
                      {saveError ?? errorFor("votes")?.message}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      onDetailsStep && "justify-end",
                    )}
                  >
                    {onDetailsStep ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={backToAvailability}
                      >
                        <Trans i18nKey="back" defaults="Back" />
                      </Button>
                    ) : null}
                    <Button
                      type="submit"
                      variant="primary"
                      className={cn(
                        onDetailsStep
                          ? "rounded-xl"
                          : `${ballotBarButtonClassName} flex-1`,
                      )}
                      aria-disabled={pending || undefined}
                    >
                      {isNew && !onDetailsStep ? (
                        <Trans i18nKey="continue" defaults="Continue" />
                      ) : pending ? (
                        <Trans i18nKey="screenReaderSaving" defaults="Saving" />
                      ) : (
                        <Trans
                          i18nKey="screenReaderConfirm"
                          defaults="Confirm"
                        />
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </form>
          )}
          {responseDialogs}
        </div>
      </main>
    </>
  );
}
