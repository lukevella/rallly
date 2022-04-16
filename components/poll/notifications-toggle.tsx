import { Trans, useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import * as React from "react";

import Button from "@/components/button";
import Bell from "@/components/icons/bell.svg";
import BellCrossed from "@/components/icons/bell-crossed.svg";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";
import { useUpdatePollMutation } from "./mutations";

export interface NotificationsToggleProps {}

const NotificationsToggle: React.VoidFunctionComponent<NotificationsToggleProps> =
  () => {
    const { poll } = usePoll();
    const { t } = useTranslation("app");
    const [isUpdatingNotifications, setIsUpdatingNotifications] =
      React.useState(false);

    const { mutate: updatePollMutation } = useUpdatePollMutation();

    const plausible = usePlausible();
    return (
      <Tooltip
        content={
          poll.verified ? (
            poll.notifications ? (
              <div>
                <div className="font-medium text-indigo-300">
                  Notifications are on
                </div>
                <div className="max-w-sm">
                  <Trans
                    t={t}
                    i18nKey="notificationsOnDescription"
                    values={{
                      email: poll.user.email,
                    }}
                    components={{
                      b: (
                        <span className="whitespace-nowrap font-mono font-medium text-indigo-300 " />
                      ),
                    }}
                  />
                </div>
              </div>
            ) : (
              "Notifications are off"
            )
          ) : (
            "You need to verify your email to turn on notifications"
          )
        }
      >
        <Button
          loading={isUpdatingNotifications}
          icon={
            poll.verified && poll.notifications ? <Bell /> : <BellCrossed />
          }
          disabled={!poll.verified}
          onClick={() => {
            setIsUpdatingNotifications(true);
            updatePollMutation(
              {
                notifications: !poll.notifications,
              },
              {
                onSuccess: ({ notifications }) => {
                  plausible(
                    notifications
                      ? "Turned notifications on"
                      : "Turned notifications off",
                  );
                  setIsUpdatingNotifications(false);
                },
              },
            );
          }}
        />
      </Tooltip>
    );
  };

export default NotificationsToggle;
