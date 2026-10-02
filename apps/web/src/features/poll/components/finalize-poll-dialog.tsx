"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Checkbox } from "@rallly/ui/checkbox";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Label } from "@rallly/ui/label";
import { toast } from "@rallly/ui/sonner";
import { SuccessCheck, SuccessCheckIcon } from "@rallly/ui/success-check";
import { CalendarIcon, MapPinIcon, StarIcon, VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import {
  DataListCell,
  DataListRoot,
  DataListRow,
} from "@/components/data-list";
import { OptimizedAvatarImage } from "@/components/optimized-avatar-image";
import { getCityFromTimezoneId } from "@/components/time-zone-picker/timezone-data";
import { primePayWall, usePayWallStore } from "@/features/billing/client";
import { PayWallDialog } from "@/features/billing/components/pay-wall-dialog";
import { ConferencingProviderIcon } from "@/features/conferencing/components/conferencing-provider-icon";
import { conferencingProviderLabels } from "@/features/conferencing/utils";
import { useParticipants, usePoll } from "@/features/poll/client";
import { ConnectedScoreSummary } from "@/features/poll/components/score-summary";
import VoteIcon from "@/features/poll/components/vote-icon";
import { VoteSummaryProgressBar } from "@/features/poll/components/vote-summary-progress-bar";
import type { VoteType } from "@/features/poll/constants";
import { VOTE_TYPES } from "@/features/poll/constants";
import type { PollParticipant } from "@/features/poll/types";
import type { OptionVotes } from "@/features/poll/utils";
import { rankOptionsByPopularity } from "@/features/poll/utils";
import {
  EventDate,
  EventTimeRange,
} from "@/features/scheduled-event/components/event-date-time";
import { Trans, useTranslation } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { trpc } from "@/trpc/client";

type RankedOption = {
  id: string;
  startTime: Date;
  duration: number;
  votes: OptionVotes;
};

function OptionCell({
  option,
  onPick,
}: {
  option: RankedOption;
  onPick: () => void;
}) {
  const poll = usePoll();
  return (
    // The button is the row's click target; the overlay makes the whole row
    // pick the option.
    <button
      type="button"
      onClick={onPick}
      className="block min-w-0 truncate text-left text-sm after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
    >
      <EventDate
        value={option.startTime}
        allDay={option.duration === 0}
        timeZone={poll.timeZone}
        preset="dateFull"
      />
    </button>
  );
}

function OptionTimeCell({ option }: { option: RankedOption }) {
  const poll = usePoll();
  const allDay = option.duration === 0;
  return (
    <span className="whitespace-nowrap text-muted-foreground text-sm">
      <EventTimeRange
        start={option.startTime}
        end={new Date(option.startTime.getTime() + option.duration * 60_000)}
        allDay={allDay}
        timeZone={poll.timeZone}
      />
    </span>
  );
}

function OptionVotesCell({ votes }: { votes: OptionVotes }) {
  const poll = usePoll();
  const { participants } = useParticipants();
  return (
    <div className="relative z-10 flex w-32">
      <VoteSummaryProgressBar
        {...votes}
        total={participants.length}
        showTentative={poll.allowTentativeVotes}
      />
    </div>
  );
}

const TOP_OPTIONS = 5;

const medalClassName: Record<number, string> = {
  1: "bg-amber-400",
  2: "bg-zinc-400",
  3: "bg-amber-700",
};

function RankMedal({ rank }: { rank: number }) {
  const className = medalClassName[rank];
  return (
    <span
      className={cn(
        "flex size-4 items-center justify-center rounded-full text-white",
        className,
      )}
    >
      {className ? (
        <StarIcon aria-hidden className="size-2.5" fill="currentColor" />
      ) : null}
      <span className="sr-only">#{rank}</span>
    </span>
  );
}

function PickDateStep({
  options,
  onPick,
}: {
  options: RankedOption[];
  onPick: (optionId: string) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? options : options.slice(0, TOP_OPTIONS);
  // A date poll has no times to show.
  const hasTimes = options.some((option) => option.duration > 0);

  return (
    <div className="-mx-4 max-h-96 overflow-y-auto">
      <DataListRoot
        className={
          hasTimes
            ? "grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
            : "grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
        }
      >
        {visible.map((option, index) => (
          <DataListRow key={option.id}>
            <DataListCell>
              <RankMedal rank={index + 1} />
            </DataListCell>
            <DataListCell>
              <OptionCell option={option} onPick={() => onPick(option.id)} />
            </DataListCell>
            {hasTimes ? (
              <DataListCell>
                <OptionTimeCell option={option} />
              </DataListCell>
            ) : null}
            <DataListCell className="hidden sm:flex">
              <OptionVotesCell votes={option.votes} />
            </DataListCell>
            <DataListCell>
              <div className="relative z-10">
                <ConnectedScoreSummary optionId={option.id} />
              </div>
            </DataListCell>
          </DataListRow>
        ))}
      </DataListRoot>
      {options.length > TOP_OPTIONS && !showAll ? (
        <div className="px-4 pb-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(true)}
          >
            <Trans
              i18nKey="finalizeViewMoreOptions"
              defaults="{count, plural, one {View # more option} other {View # more options}}"
              values={{ count: options.length - TOP_OPTIONS }}
            />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PickedDate({ option }: { option: RankedOption }) {
  const poll = usePoll();
  const { timeZone: displayTimeZone } = useDateTimeConfig();
  const allDay = option.duration === 0;
  // Fixed instants render in the viewer's zone; floating times have none.
  const cityTimeZone =
    !allDay && poll.timeZone !== null ? displayTimeZone : undefined;
  return (
    <div className="flex items-start gap-3">
      {/* The icon centers on the first line, not the block. */}
      <CalendarIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate text-sm leading-5">
          <EventDate
            value={option.startTime}
            allDay={allDay}
            timeZone={poll.timeZone}
            preset="dateFull"
          />
        </div>
        <div className="truncate text-muted-foreground text-sm">
          <EventTimeRange
            start={option.startTime}
            end={
              new Date(option.startTime.getTime() + option.duration * 60_000)
            }
            allDay={allDay}
            timeZone={poll.timeZone}
          />
          {cityTimeZone ? (
            <>
              {" ("}
              <Trans
                i18nKey="cityTime"
                defaults="{city} time"
                values={{ city: getCityFromTimezoneId(cityTimeZone) }}
              />
              {")"}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ParticipantCell({ participant }: { participant: PollParticipant }) {
  return (
    <Label
      htmlFor={`notify-${participant.id}`}
      className="flex min-w-0 items-center gap-3 after:absolute after:inset-0 after:rounded-lg"
    >
      <OptimizedAvatarImage
        size="sm"
        name={participant.name}
        src={participant.image ?? undefined}
        className="shrink-0"
      />
      <span className="truncate text-sm">{participant.name}</span>
    </Label>
  );
}

function voteFor(participant: PollParticipant, optionId: string) {
  return participant.votes.find((vote) => vote.optionId === optionId)?.type;
}

// Yes first, then if need be, then no, then people who didn't vote.
function voteRank(vote: VoteType | undefined) {
  return vote ? VOTE_TYPES.indexOf(vote) : VOTE_TYPES.length;
}

function toggleIds({
  selectedIds,
  ids,
  checked,
}: {
  selectedIds: Set<string>;
  ids: string[];
  checked: boolean;
}) {
  const next = new Set(selectedIds);
  for (const id of ids) {
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
  }
  return next;
}

function VoteShortcut({
  voteType,
  ids,
  selectedIds,
  onChange,
}: {
  voteType: VoteType;
  ids: string[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useTranslation();
  const pressed = ids.every((id) => selectedIds.has(id));
  const label = {
    yes: t("notifySelectYes", {
      defaultValue: "Select everyone who voted yes",
    }),
    ifNeedBe: t("notifySelectIfNeedBe", {
      defaultValue: "Select everyone who voted if need be",
    }),
    no: t("notifySelectNo", { defaultValue: "Select everyone who voted no" }),
  }[voteType];
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-input border-dashed pr-3 pl-2 text-muted-foreground text-sm outline-none transition-colors hover:border-solid hover:bg-foreground/3 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-foreground/15 aria-pressed:border-solid aria-pressed:bg-foreground/6 aria-pressed:text-foreground aria-pressed:hover:border-foreground/25 aria-pressed:hover:bg-foreground/10"
      onClick={() =>
        onChange(toggleIds({ selectedIds, ids, checked: !pressed }))
      }
    >
      <VoteIcon type={voteType} />
      <span className="tabular-nums">{ids.length}</span>
    </button>
  );
}

function NotifyStep({
  optionId,
  selectedIds,
  onChange,
}: {
  optionId: string;
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { participants } = useParticipants();
  const sortedParticipants = React.useMemo(
    () =>
      [...participants].sort(
        (a, b) =>
          voteRank(voteFor(a, optionId)) - voteRank(voteFor(b, optionId)),
      ),
    [participants, optionId],
  );
  const notifiableIds = React.useMemo(
    () => participants.filter((p) => p.email).map((p) => p.id),
    [participants],
  );
  const notifiableIdsByVote = React.useMemo(() => {
    const byVote: Record<VoteType, string[]> = {
      yes: [],
      ifNeedBe: [],
      no: [],
    };
    for (const participant of participants) {
      const vote = voteFor(participant, optionId);
      if (participant.email && vote) {
        byVote[vote].push(participant.id);
      }
    }
    return byVote;
  }, [participants, optionId]);
  const voteTypes = VOTE_TYPES.filter(
    (type) => notifiableIdsByVote[type].length > 0,
  );
  const allSelected =
    notifiableIds.length > 0 &&
    notifiableIds.every((id) => selectedIds.has(id));
  const someSelected = notifiableIds.some((id) => selectedIds.has(id));

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card">
      <div className="flex h-12 items-center gap-3 border-card-border border-b bg-muted/40 pr-3 pl-6">
        <Checkbox
          id="notify-all"
          checked={allSelected}
          indeterminate={!allSelected && someSelected}
          disabled={notifiableIds.length === 0}
          onCheckedChange={(checked) =>
            onChange(new Set(checked ? notifiableIds : []))
          }
        />
        <Label htmlFor="notify-all" className="text-sm">
          <Trans
            i18nKey="notifySelectedCount"
            defaults="{count, plural, =0 {Select all} one {# selected} other {# selected}}"
            values={{
              count: notifiableIds.filter((id) => selectedIds.has(id)).length,
            }}
          />
        </Label>
        <div className="ml-auto flex items-center gap-1">
          {voteTypes.map((voteType) => (
            <VoteShortcut
              key={voteType}
              voteType={voteType}
              ids={notifiableIdsByVote[voteType]}
              selectedIds={selectedIds}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
      <DataListRoot className="max-h-72 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] overflow-y-auto px-2">
        {sortedParticipants.map((participant) => (
          <DataListRow key={participant.id}>
            <DataListCell>
              <Checkbox
                id={`notify-${participant.id}`}
                className="relative z-10"
                checked={selectedIds.has(participant.id)}
                disabled={!participant.email}
                onCheckedChange={(checked) =>
                  onChange(
                    toggleIds({ selectedIds, ids: [participant.id], checked }),
                  )
                }
              />
            </DataListCell>
            <DataListCell>
              <ParticipantCell participant={participant} />
            </DataListCell>
            <DataListCell>
              <span className="truncate text-muted-foreground text-sm">
                {participant.email ?? (
                  <span className="pr-0.5 italic">
                    <Trans i18nKey="noEmail" defaults="No email" />
                  </span>
                )}
              </span>
            </DataListCell>
            <DataListCell>
              <VoteIcon type={voteFor(participant, optionId)} />
            </DataListCell>
          </DataListRow>
        ))}
      </DataListRoot>
    </div>
  );
}

type Step = "date" | "notify" | "summary" | "done";

// Each step sets its own width and the dialog eases between them. The wide
// steps match a 2xl dialog's content box; the success step is narrower.
const wideStepClassName = "grid w-[calc(100vw-4rem)] gap-4 sm:w-[40rem]";
const narrowStepClassName = "grid w-[calc(100vw-4rem)] gap-4 sm:w-[26rem]";

function PickedDateText({ option }: { option: RankedOption }) {
  const poll = usePoll();
  const allDay = option.duration === 0;
  return (
    <>
      <EventDate
        value={option.startTime}
        allDay={allDay}
        timeZone={poll.timeZone}
        preset="dateFull"
      />
      {allDay ? null : (
        <>
          {", "}
          <EventTimeRange
            start={option.startTime}
            end={
              new Date(option.startTime.getTime() + option.duration * 60_000)
            }
            allDay={allDay}
            timeZone={poll.timeZone}
          />
        </>
      )}
    </>
  );
}

function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 break-words text-sm leading-5">{children}</div>
    </div>
  );
}

// What the event will carry, laid out as the confirmation email shows it.
function SummaryStep({ option }: { option: RankedOption }) {
  const poll = usePoll();
  const conferencing = poll.conferencing;
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <PickedDate option={option} />
      {poll.location ? (
        <DetailRow icon={<MapPinIcon />}>{poll.location}</DetailRow>
      ) : null}
      {conferencing ? (
        <DetailRow
          icon={
            conferencing.provider === "custom" ? (
              <VideoIcon />
            ) : (
              <ConferencingProviderIcon
                provider={conferencing.provider}
                size={16}
              />
            )
          }
        >
          <div>
            {conferencing.provider === "custom"
              ? conferencing.label
              : conferencingProviderLabels[conferencing.provider]}
          </div>
          {conferencing.provider === "custom" && conferencing.uri ? (
            <div className="break-all text-muted-foreground">
              <a
                href={conferencing.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {conferencing.uri}
              </a>
            </div>
          ) : null}
        </DetailRow>
      ) : null}
    </div>
  );
}

// Mounted fresh with each open, so the wizard starts at step one with
// nothing carried over from a previous run.
function FinalizeWizard({ onClose }: { onClose: () => void }) {
  const poll = usePoll();
  const { participants } = useParticipants();
  const router = useRouter();
  // The pay wall nests inside the wizard so it stacks above it and the
  // wizard survives it; the app-wide instance would sit underneath.
  const payWall = useDialog();
  const payWallPricing = usePayWallStore((state) => state.pricing);
  const openPayWall = (action: string) => {
    primePayWall({ from: "finalize-dialog", action, pollId: poll.id });
    payWall.trigger();
  };
  const options = React.useMemo(
    () => rankOptionsByPopularity({ options: poll.options, participants }),
    [poll.options, participants],
  );
  const [step, setStep] = React.useState<Step>("date");
  const [optionId, setOptionId] = React.useState<string | null>(null);
  const [notifyIds, setNotifyIds] = React.useState(
    () => new Set(participants.filter((p) => p.email).map((p) => p.id)),
  );
  const option = options.find((o) => o.id === optionId);

  const finalize = trpc.polls.book.useMutation({
    onSuccess: () => {
      setStep("done");
      // The page behind the dialog picks up the scheduled status.
      router.refresh();
    },
    onError: (error) => {
      if (error.data?.code === "PAYMENT_REQUIRED") {
        openPayWall("finalize");
        return;
      }
      toast.error(
        <Trans
          i18nKey="finalizePollError"
          defaults="Failed to finalize poll"
        />,
      );
    },
  });

  if (step === "date" || !option) {
    return (
      <div className={wideStepClassName}>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalizePoll" defaults="Finalize poll" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="finalizePollDescription"
              defaults="Pick the date that works best."
            />
          </DialogDescription>
        </DialogHeader>
        <PickDateStep
          options={options}
          onPick={(id) => {
            setOptionId(id);
            // With nobody to notify, the notify step has nothing to ask.
            setStep(participants.length > 0 ? "notify" : "summary");
          }}
        />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={narrowStepClassName}>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <SuccessCheck state="in">
            <SuccessCheckIcon />
          </SuccessCheck>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="finalizeSuccessTitle" defaults="Date scheduled" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="finalizeSuccessDate"
                defaults="Your event is booked for <date></date>."
                components={{ date: <PickedDateText option={option} /> }}
              />{" "}
              <Trans
                i18nKey="finalizeSuccessNotified"
                defaults="{count, plural, =0 {No participants were notified.} one {# participant has been notified.} other {# participants have been notified.}}"
                values={{ count: notifyIds.size }}
              />
            </DialogDescription>
          </DialogHeader>
        </div>
        <Button className="w-full" onClick={onClose}>
          <Trans i18nKey="backToPoll" defaults="Back to poll" />
        </Button>
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div className={narrowStepClassName}>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="finalizeSummaryTitle" defaults="Summary" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="finalizeSummaryDescription"
              defaults="Check the details before you finalize."
            />
          </DialogDescription>
        </DialogHeader>
        <SummaryStep option={option} />
        <PayWallDialog
          pricing={payWallPricing}
          isOpen={payWall.dialogProps.open}
          onOpenChange={payWall.dialogProps.onOpenChange}
        />
        <DialogFooter>
          <Button
            onClick={() => setStep(participants.length > 0 ? "notify" : "date")}
          >
            <Trans i18nKey="back" defaults="Back" />
          </Button>
          <Button
            variant="primary"
            loading={finalize.isPending}
            onClick={() => {
              finalize.mutate({
                pollId: poll.id,
                optionId: option.id,
                notifyParticipantIds: Array.from(notifyIds),
              });
            }}
          >
            <Trans
              i18nKey="finalizeAndNotify"
              defaults="{count, plural, =0 {Finalize} one {Finalize and notify # participant} other {Finalize and notify # participants}}"
              values={{ count: notifyIds.size }}
            />
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className={wideStepClassName}>
      <DialogHeader>
        <DialogTitle>
          <Trans i18nKey="notifyParticipants" defaults="Notify participants" />
        </DialogTitle>
        <DialogDescription>
          <Trans
            i18nKey="notifyParticipantsDescription"
            defaults="Email the final date and a calendar invite to the people you select."
          />
        </DialogDescription>
      </DialogHeader>
      <NotifyStep
        optionId={option.id}
        selectedIds={notifyIds}
        onChange={setNotifyIds}
      />
      <DialogFooter>
        <Button onClick={() => setStep("date")}>
          <Trans i18nKey="back" defaults="Back" />
        </Button>
        <Button variant="primary" onClick={() => setStep("summary")}>
          <Trans i18nKey="next" defaults="Next" />
        </Button>
      </DialogFooter>
    </div>
  );
}

export function FinalizePollDialog(props: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="w-auto sm:max-w-none">
        <FinalizeWizard onClose={() => props.onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  );
}
