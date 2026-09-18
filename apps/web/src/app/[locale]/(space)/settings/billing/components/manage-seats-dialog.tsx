"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import type { DialogProps } from "@rallly/ui/dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { NumberTicker } from "@rallly/ui/number-ticker";
import { MinusIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

const MAX_SEATS = 999;

const GAUGE_SIZE = 88;
const GAUGE_STROKE = 6;
const GAUGE_RADIUS = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * Ring around the seat count showing how much of the new total is already
 * taken. Over-allocation (fewer seats than members) fills the ring and turns
 * destructive, so the error message is not the only signal.
 */
function SeatGauge({
  usedSeats,
  totalSeats,
  children,
}: {
  usedSeats: number;
  totalSeats: number;
  children: React.ReactNode;
}) {
  const ratio = totalSeats > 0 ? Math.min(usedSeats / totalSeats, 1) : 1;
  const overAllocated = usedSeats > totalSeats;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        aria-hidden="true"
      >
        <circle
          className="text-border"
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={GAUGE_STROKE}
        />
        <circle
          className={cn(
            "transition-[stroke-dashoffset,color] duration-300 ease-out motion-reduce:transition-none",
            overAllocated ? "text-destructive" : "text-primary",
          )}
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
          strokeDasharray={GAUGE_CIRCUMFERENCE}
          strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - ratio)}
        />
      </svg>
      {children}
    </div>
  );
}

export function ManageSeatsDialog({
  onOpenChange,
  open,
  children,
  currentSeats,
  usedSeats,
}: DialogProps & { currentSeats: number; usedSeats: number }) {
  const [newSeatCount, setNewSeatCount] = React.useState(currentSeats);
  // The stepper is allowed below usedSeats so the reason surfaces as a
  // message; a silently clamped button leaves the user guessing.
  const [showUsedSeatsError, setShowUsedSeatsError] = React.useState(false);

  const seatDelta = newSeatCount - currentSeats;
  const belowUsedSeats = newSeatCount < usedSeats;
  const hasChanges = seatDelta !== 0;

  const updateSeats = trpc.billing.updateSeats.useMutation();

  const handleDecrement = () => {
    if (newSeatCount <= 1) {
      return;
    }
    const next = newSeatCount - 1;
    setNewSeatCount(next);
    setShowUsedSeatsError(next < usedSeats);
  };

  const handleIncrement = () => {
    const next = Math.min(newSeatCount + 1, MAX_SEATS);
    setNewSeatCount(next);
    setShowUsedSeatsError(next < usedSeats);
  };

  const handleUpdate = async () => {
    const { url } = await updateSeats.mutateAsync({ seatDelta });
    window.location.href = url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent size="sm" className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="manageSeats" defaults="Manage seats" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="manageSeatsDescription"
              defaults="Adjust the number of seats for your space."
            />
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-6">
            <Button
              size="icon-lg"
              className="rounded-full"
              onClick={handleDecrement}
              disabled={newSeatCount <= 1}
            >
              <MinusIcon />
              <span className="sr-only">
                <Trans i18nKey="decreaseSeats" defaults="Decrease seats" />
              </span>
            </Button>
            <SeatGauge usedSeats={usedSeats} totalSeats={newSeatCount}>
              <NumberTicker
                value={newSeatCount}
                announceChanges
                duration={0.4}
                className="inline-flex w-[3ch] justify-center font-semibold text-3xl"
              />
            </SeatGauge>
            <Button
              size="icon-lg"
              className="rounded-full"
              onClick={handleIncrement}
              disabled={newSeatCount >= MAX_SEATS}
            >
              <PlusIcon />
              <span className="sr-only">
                <Trans i18nKey="increaseSeats" defaults="Increase seats" />
              </span>
            </Button>
          </div>
          {showUsedSeatsError ? null : (
            <p className="text-center text-muted-foreground text-sm">
              <Trans
                i18nKey="seatsUnusedCount"
                defaults="{used} of {total} seats used"
                values={{ used: usedSeats, total: newSeatCount }}
              />
            </p>
          )}
          {showUsedSeatsError ? (
            <p role="alert" className="text-center text-destructive text-sm">
              <Trans
                i18nKey="seatsBelowUsedError"
                defaults="You can only remove unused seats. Remove members first."
              />
            </p>
          ) : null}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-col-reverse">
          <DialogClose render={<Button className="w-full" />}>
            <Trans i18nKey="cancel" defaults="Cancel" />
          </DialogClose>
          <Button
            className="w-full"
            variant="primary"
            onClick={handleUpdate}
            disabled={belowUsedSeats || !hasChanges}
            loading={updateSeats.isPending}
          >
            {seatDelta > 0 ? (
              <Trans
                i18nKey="addSeats"
                defaults="{count, plural, one {Add # seat} other {Add # seats}}"
                values={{ count: seatDelta }}
              />
            ) : seatDelta < 0 ? (
              <Trans
                i18nKey="removeSeats"
                defaults="{count, plural, one {Remove # seat} other {Remove # seats}}"
                values={{ count: Math.abs(seatDelta) }}
              />
            ) : (
              <Trans i18nKey="noChanges" defaults="No changes" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
