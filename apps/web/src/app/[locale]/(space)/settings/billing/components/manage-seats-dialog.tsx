"use client";

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
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Trans } from "@/components/trans";
import { updateSeatsAction } from "@/features/billing/actions";
import { useSafeAction } from "@/lib/safe-action/client";

interface ManageSeatsButtonProps {
  currentSeats: number;
  usedSeats: number;
}

interface SeatCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  currentSeats: number;
  minSeats: number;
}

function SeatCountSelector({
  value,
  onChange,
  currentSeats,
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
    <div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="default"
          onClick={handleDecrement}
          disabled={!canDecrement}
        >
          <Icon>
            <MinusIcon />
          </Icon>
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
        />

        <Button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
        >
          <Icon>
            <PlusIcon />
          </Icon>
          <span className="sr-only">
            <Trans i18nKey="increaseSeats" defaults="Increase seats" />
          </span>
        </Button>
      </div>
    </div>
  );
}

export function ManageSeatsDialog({
  onOpenChange,
  open,
  children,
  currentSeats,
  usedSeats,
}: DialogProps & ManageSeatsButtonProps) {
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
    updateSeats({ seatDelta });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent size="md">
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
        <div className="flex items-end justify-between gap-4">
          <div>
            <Label className="mb-2">
              <Trans i18nKey="totalSeats" defaults="Total Seats" />
            </Label>

            <p className="mt-1 text-muted-foreground text-sm">
              <Trans
                i18nKey="currentlyUsing"
                defaults="Currently using {usedSeats} of {currentSeats} seats"
                values={{ usedSeats, currentSeats }}
              />
            </p>
          </div>
          <SeatCountSelector
            value={newSeatCount}
            onChange={setNewSeatCount}
            currentSeats={currentSeats}
            minSeats={usedSeats}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>
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
  );
}
