import { Button } from "@rallly/ui/button";
import { Icon } from "@rallly/ui/icon";
import { CheckIcon, PlusIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { getGuestPolls } from "@/features/quick-create/lib/get-guest-polls";
import { getTranslation } from "@/i18n/server";

import { RelativeDate } from "./components/relative-date";

export async function QuickCreateWidget() {
  const polls = await getGuestPolls();
  const { t } = await getTranslation();
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="text-primary inline-flex items-center justify-center gap-2 rounded-md font-medium">
          <ZapIcon className="size-5" />
          <h2>
            <Trans
              t={t}
              ns="app"
              i18nKey="quickCreate"
              defaults="Quick Create"
            />
          </h2>
        </div>
        <p className="text-muted-foreground text-pretty">
          <Trans
            t={t}
            ns="app"
            i18nKey="quickActionsDescription"
            defaults="Create a group poll without signing in. Login later to link it to your account."
          />
        </p>
        {polls.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">
              <Trans
                t={t}
                ns="app"
                i18nKey="quickCreateRecentlyCreated"
                defaults="Recently Created"
              />
            </h3>
            <ul className="space-y-2">
              {polls.map((poll) => (
                <li key={poll.id}>
                  <Link
                    href={`/poll/${poll.id}`}
                    className="flex items-center gap-3 rounded-xl border bg-white p-3 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div>
                      <GroupPollIcon size="lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{poll.title}</div>
                      <div className="text-muted-foreground whitespace-nowrap text-sm">
                        <RelativeDate date={poll.createdAt} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <Button asChild size="lg" className="w-full">
            <Link href="/new">
              <Icon size="lg">
                <PlusIcon />
              </Icon>
              <Trans
                t={t}
                ns="app"
                i18nKey="quickCreateGroupPoll"
                defaults="Create Group Poll"
              />
            </Link>
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">
            <Trans
              t={t}
              ns="app"
              i18nKey="quickCreateWhyCreateAnAccount"
              defaults="Why create an account?"
            />
          </h3>
        </div>
        <ul className="text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <Icon variant="success" size="lg">
              <CheckIcon />
            </Icon>
            <Trans
              t={t}
              ns="app"
              i18nKey="quickCreateSecurePolls"
              defaults="Store polls securely in your account"
            />
          </li>
          <li className="flex items-center gap-2">
            <Icon variant="success" size="lg">
              <CheckIcon />
            </Icon>
            <Trans
              t={t}
              ns="app"
              i18nKey="quickCreateGetNotifications"
              defaults="Get email notifications"
            />
          </li>
          <li className="flex items-center gap-2">
            <Icon variant="success" size="lg">
              <CheckIcon />
            </Icon>
            <Trans
              t={t}
              ns="app"
              i18nKey="quickCreateManagePollsFromAnyDevice"
              defaults="Manage your polls from any device"
            />
          </li>
        </ul>
      </div>
    </div>
  );
}
