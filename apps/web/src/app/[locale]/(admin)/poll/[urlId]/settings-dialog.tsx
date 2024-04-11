"use client";

import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rallly/ui/dialog";
import { Input } from "@rallly/ui/input";
import { Label } from "@rallly/ui/label";
import { Textarea } from "@rallly/ui/textarea";

import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";

export function SettingsDialog({ children }: { children?: React.ReactNode }) {
  const poll = usePoll();
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="editDetails" />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2.5">
            <Label>Title</Label>
            <Input value={poll.title} className="w-full" />
          </div>
          <div className="space-y-2.5">
            <Label>Location</Label>
            <Input value={poll.location} className="w-full" />
          </div>
          <div className="space-y-2.5">
            <Label>Description</Label>
            <Textarea value={poll.description} className="w-full" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="primary">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
