import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import { Input } from "@rallly/ui/input";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Trans } from "@/i18n/client";
import { useDateTimeConfig } from "@/lib/datetime/client";
import { instantToWallTime, wallTimeToInstant } from "@/lib/datetime/wall-time";
import { trpc } from "@/trpc/client";

export const DeadlineDialog: React.FunctionComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  deadline: Date | null;
}> = ({ open, onOpenChange, pollId, deadline }) => {
  const router = useRouter();
  // <input type="datetime-local"> holds a wall time (YYYY-MM-DDTHH:mm) in
  // the viewer's time zone.
  const timeZone = useDateTimeConfig().timeZone ?? "UTC";
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setValue(
        deadline ? instantToWallTime(deadline, timeZone).slice(0, 16) : "",
      );
    }
  }, [open, deadline, timeZone]);

  const setDeadline = trpc.polls.setDeadline.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      router.refresh();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="pollDeadline" defaults="Voting deadline" />
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="pollDeadlineDescription"
              defaults="Once this date has passed, participants can no longer add or change their votes."
            />
          </DialogDescription>
        </DialogHeader>
        <Input
          type="datetime-local"
          aria-label="deadline"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <DialogFooter>
          {deadline ? (
            <Button
              onClick={() => setDeadline.mutate({ pollId, deadline: null })}
              disabled={setDeadline.isPending}
            >
              <Trans i18nKey="pollDeadlineRemove" defaults="Remove deadline" />
            </Button>
          ) : null}
          <Button
            variant="primary"
            disabled={!value}
            loading={setDeadline.isPending}
            onClick={() =>
              setDeadline.mutate({
                pollId,
                deadline: wallTimeToInstant(value, timeZone),
              })
            }
          >
            <Trans i18nKey="save" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
