import { Trans, useTranslation } from "next-i18next";
import { usePlausible } from "next-plausible";
import * as React from "react";

import { Button } from "@/components/button";
import Bell from "@/components/icons/bell.svg";
import BellCrossed from "@/components/icons/bell-crossed.svg";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";
import { useUpdatePollMutation } from "./mutations";

const NotificationsToggle: React.VoidFunctionComponent = () => {
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
              <div className="text-primary-300 font-medium">
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
                      <span className="text-primary-300 whitespace-nowrap font-mono font-medium " />
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
        icon={poll.verified && poll.notifications ? <Bell /> : <BellCrossed />}
        disabled={!poll.verified}
        onClick={() => {
          setIsUpdatingNotifications(true);
          updatePollMutation(
            {
              urlId: poll.urlId,
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
