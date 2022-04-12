import * as React from "react";
import Tooltip from "../tooltip";
import { usePoll } from "../use-poll";
import { Trans, useTranslation } from "next-i18next";
import Button from "@/components/button";
import Bell from "@/components/icons/bell.svg";
import BellCrossed from "@/components/icons/bell-crossed.svg";
import { useUpdatePollMutation } from "./mutations";
import { usePlausible } from "next-plausible";

export interface NotificationsToggleProps {}

const NotificationsToggle: React.VoidFunctionComponent<NotificationsToggleProps> =
  () => {
    const poll = usePoll();
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
                        <span className="text-indigo-300 whitespace-nowrap font-medium font-mono " />
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
