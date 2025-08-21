"use client";

import { usePostHog } from "@rallly/posthog/client";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { SidebarMenuButton, SidebarMenuItem } from "@rallly/ui/sidebar";
import { MegaphoneIcon } from "lucide-react";
import { Trans } from "@/components/trans";
import { FeedbackDialog } from "@/features/feedback/components/feedback-dialog";

export function FeedbackMenuItem() {
  const dialog = useDialog();
  const posthog = usePostHog();
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          {...dialog.triggerProps}
          onClick={() => {
            posthog?.capture("space_sidebar:feedback_menu_item_click");
            dialog.trigger();
          }}
        >
          <Icon>
            <MegaphoneIcon />
          </Icon>
          <Trans i18nKey="sendFeedback" defaults="Send Feedback" />
        </SidebarMenuButton>
      </SidebarMenuItem>
      <FeedbackDialog {...dialog.dialogProps} />
    </>
  );
}
