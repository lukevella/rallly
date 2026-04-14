"use client";

import { useDialog } from "@rallly/ui/dialog";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { MegaphoneIcon } from "lucide-react";
import { FeedbackDialog } from "@/features/feedback/components/feedback-dialog";
import { Trans } from "@/i18n/client";

export function FeedbackMenuItem() {
  const dialog = useDialog();
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          {...dialog.triggerProps}
          onClick={() => {
            dialog.trigger();
          }}
        >
          <MegaphoneIcon />
          <Trans i18nKey="sendFeedback" defaults="Send Feedback" />
        </SidebarMenuButton>
      </SidebarMenuItem>
      <FeedbackDialog {...dialog.dialogProps} />
    </>
  );
}
