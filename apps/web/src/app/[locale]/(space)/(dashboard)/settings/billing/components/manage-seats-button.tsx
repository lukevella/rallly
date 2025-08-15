"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { ArmchairIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { Trans } from "@/components/trans";
import { updateSeatsAction } from "@/features/billing/actions";
import { useSafeAction } from "@/lib/safe-action/client";
import { isSelfHosted } from "@/utils/constants";

interface ManageSeatsButtonProps {
  currentSeats: number;
  usedSeats: number;
}

interface SeatCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  currentSeats: number;
  usedSeats: number;
  minSeats: number;
}

function SeatCountSelector({
  value,
  onChange,
  currentSeats,
  usedSeats,
  minSeats,
}: SeatCountSelectorProps) {
  const handleIncrement = useCallback(() => {
    onChange(value + 1);
  }, [value, onChange]);

  const handleDecrement = useCallback(() => {
    if (value > minSeats) {
      onChange(value - 1);
    }
  }, [value, minSeats, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty input for better UX while typing
      if (inputValue === "") {
        return;
      }

      const numValue = Number.parseInt(inputValue, 10);

      // Only update if it's a valid positive integer
      if (!Number.isNaN(numValue) && numValue >= minSeats && numValue <= 999) {
        onChange(numValue);
      }
    },
    [minSeats, onChange],
  );

  const handleInputBlur = useCallback(() => {
    // If the input is empty or invalid on blur, reset to current value
    if (value < minSeats || Number.isNaN(value)) {
      onChange(currentSeats);
    }
  }, [value, minSeats, currentSeats, onChange]);

  const canDecrement = value > minSeats;
  const canIncrement = value < 999; // Reasonable upper limit

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">
            <Trans i18nKey="totalSeats" defaults="Total Seats" />
          </div>
          <div className="text-muted-foreground text-xs">
            <Trans
              i18nKey="currentlyUsing"
              defaults="Currently using {usedSeats} of {currentSeats} seats"
              values={{ usedSeats, currentSeats }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleDecrement}
            disabled={!canDecrement}
            className="size-8 p-0"
          >
            <MinusIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="decreaseSeats" defaults="Decrease seats" />
            </span>
          </Button>

          <Input
            type="number"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={minSeats}
            max={999}
            className="w-20 text-center"
            size="sm"
          />

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleIncrement}
            disabled={!canIncrement}
            className="size-8 p-0"
          >
            <PlusIcon className="size-4" />
            <span className="sr-only">
              <Trans i18nKey="increaseSeats" defaults="Increase seats" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ManageSeatsButton({
  currentSeats,
  usedSeats,
}: ManageSeatsButtonProps) {
  const dialog = useDialog();
  const [newSeatCount, setNewSeatCount] = useState(currentSeats);
  const seatDelta = newSeatCount - currentSeats;
  const isRemoving = seatDelta < 0;
  const isAdding = seatDelta > 0;
  const canRemoveSeats = newSeatCount >= usedSeats;
  const hasChanges = seatDelta !== 0;

  const { execute: updateSeats, isPending } = useSafeAction(updateSeatsAction, {
    onSuccess: ({ data }) => {
      window.location.href = data.portalSessionUrl;
    },
  });

  const handleUpdate = async () => {
    if (isSelfHosted) {
      // Redirect to self-hosted licensing page
      window.location.href = "/licensing";
    } else {
      // Use Stripe billing portal with subscription_update_confirm flow
      updateSeats({ seatDelta });
    }
  };

  return (
    <>
      <Button onClick={dialog.trigger}>
        <Icon>
          <ArmchairIcon />
        </Icon>
        <Trans i18nKey="manageSeats" defaults="Manage Seats" />
      </Button>
      <Dialog {...dialog.dialogProps}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="manageSeats" defaults="Manage Seats" />
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="manageSeatsDescription"
                defaults="Adjust the number of seats for your space."
              />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <SeatCountSelector
              value={newSeatCount}
              onChange={setNewSeatCount}
              currentSeats={currentSeats}
              usedSeats={usedSeats}
              minSeats={usedSeats}
            />
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="default">
                <Trans i18nKey="cancel" defaults="Cancel" />
              </Button>
            </DialogClose>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={!canRemoveSeats || !hasChanges}
              loading={isPending}
            >
              {isAdding ? (
                <Trans
                  i18nKey="addSeats"
                  defaults="Add {count} Seats"
                  values={{ count: seatDelta }}
                />
              ) : isRemoving ? (
                <Trans
                  i18nKey="removeSeats"
                  defaults="Remove {count} Seats"
                  values={{ count: Math.abs(seatDelta) }}
                />
              ) : (
                <Trans i18nKey="noChanges" defaults="No Changes" />
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
