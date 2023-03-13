import { Trans, useTranslation } from "next-i18next";
import * as React from "react";

import { Button } from "@/components/button";
import Bell from "@/components/icons/bell.svg";
import BellCrossed from "@/components/icons/bell-crossed.svg";
import { trpc } from "@/utils/trpc";

import { usePoll } from "../poll-context";
import Tooltip from "../tooltip";
import { useUpdatePollMutation } from "./mutations";

const Email = (props: { children?: React.ReactNode }) => {
  return (
    <span className="text-primary-300 whitespace-nowrap font-mono font-medium">
      {props.children}
    </span>
  );
};

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll, urlId } = usePoll();
  const { t } = useTranslation("app");
  const [isUpdatingNotifications, setIsUpdatingNotifications] =
    React.useState(false);

  const { mutate: updatePollMutation } = useUpdatePollMutation();
  const requestEnableNotifications =
    trpc.polls.enableNotifications.useMutation();

  return (
    <Tooltip
      content={
        <div className="max-w-md">
          {requestEnableNotifications.isSuccess ? (
            <Trans
              t={t}
              i18nKey="unverifiedMessage"
              values={{
                email: poll.user.email,
              }}
              components={{ b: <Email /> }}
            />
          ) : poll.notifications ? (
            <div>
              <div className="text-primary-300 font-medium">
                {t("notificationsOn")}
              </div>
              <div className="max-w-sm">
                <Trans
                  t={t}
                  i18nKey="notificationsOnDescription"
                  values={{
                    email: poll.user.email,
                  }}
                  components={{
                    b: <Email />,
                  }}
                />
              </div>
            </div>
          ) : (
            t("notificationsOff")
          )}
        </div>
      }
    >
      <Button
        data-testid="notifications-toggle"
        loading={
          isUpdatingNotifications || requestEnableNotifications.isLoading
        }
        icon={poll.verified && poll.notifications ? <Bell /> : <BellCrossed />}
        disabled={requestEnableNotifications.isSuccess}
        onClick={async () => {
          if (!poll.verified) {
            await requestEnableNotifications.mutateAsync({
              adminUrlId: poll.adminUrlId,
            });
          } else {
            setIsUpdatingNotifications(true);
            updatePollMutation(
              {
                urlId,
                notifications: !poll.notifications,
              },
              {
                onSuccess: () => {
                  setIsUpdatingNotifications(false);
                },
              },
            );
          }
        }}
      />
    </Tooltip>
  );
};

export default NotificationsToggle;
